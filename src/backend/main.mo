import Array "mo:core/Array";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Bool "mo:core/Bool";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";

actor {
  type Timestamp = Time.Time;

  // User System =======================================================
  public type Badge = {
    #vip;
    #highScore;
    #admin;
    #founder;
  };

  public type UserProfile = {
    username : Text;
    avatarUrl : Text;
    bio : Text;
    xp : Nat;
    level : Nat;
    badges : [Badge];
    isVIP : Bool;
    isBanned : Bool;
    role : AccessControl.UserRole;
  };

  module UserProfile {
    public func compareByUsername(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      Text.compare(profile1.username, profile2.username);
    };
  };

  // Chat System =======================================================
  public type ChatRoom = {
    roomId : Nat;
    name : Text;
    description : Text;
    isVIP : Bool;
    createdBy : Principal;
  };

  public type ChatMessage = {
    messageId : Nat;
    roomId : Nat;
    sender : Principal;
    senderName : Text;
    content : Text;
    timestamp : Timestamp;
  };

  public type PrivateMessage = {
    messageId : Nat;
    sender : Principal;
    receiver : Principal;
    content : Text;
    timestamp : Timestamp;
  };

  // Game System =======================================================
  public type GameId = {
    #quiz;
    #racing;
    #shooting;
  };

  public type LeaderboardEntry = {
    gameId : GameId;
    userId : Principal;
    username : Text;
    score : Nat;
    timestamp : Timestamp;
  };

  public type PlatformStats = {
    totalUsers : Nat;
    totalMessages : Nat;
    topPlayers : [LeaderboardEntry];
  };

  // Internal Persistent Storage =======================================
  var nextRoomId = 1;
  var nextMessageId = 1;
  var nextPrivateMessageId = 1;
  var ownerPrincipal : ?Principal = null;

  let userProfiles = Map.empty<Principal, UserProfile>();
  let chatRooms = Map.empty<Nat, ChatRoom>();
  let chatMessages = Map.empty<Nat, ChatMessage>();
  var privateMessages = List.empty<PrivateMessage>();

  let quizLeaderboard = Map.empty<Nat, LeaderboardEntry>();
  let racingLeaderboard = Map.empty<Nat, LeaderboardEntry>();
  let shootingLeaderboard = Map.empty<Nat, LeaderboardEntry>();
  var nextQuizEntryId = 1;
  var nextRacingEntryId = 1;
  var nextShootingEntryId = 1;

  // Stripe Configuration ==============================================
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper Functions ==================================================

  func isOwner(caller : Principal) : Bool {
    switch (ownerPrincipal) {
      case (null) { false };
      case (?owner) { Principal.equal(caller, owner) };
    };
  };

  func isAdminOrOwner(caller : Principal) : Bool {
    isOwner(caller) or AccessControl.isAdmin(accessControlState, caller);
  };

  func getUserOrTrap(user : Principal) : UserProfile {
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?profile) { profile };
    };
  };

  func isUserVIP(user : Principal) : Bool {
    switch (userProfiles.get(user)) {
      case (null) { false };
      case (?profile) { profile.isVIP };
    };
  };

  func isUserBanned(user : Principal) : Bool {
    switch (userProfiles.get(user)) {
      case (null) { false };
      case (?profile) { profile.isBanned };
    };
  };

  func getUsername(user : Principal) : Text {
    switch (userProfiles.get(user)) {
      case (null) { user.toText() };
      case (?profile) { profile.username };
    };
  };

  func capitalize(text : Text) : Text {
    text;
  };

  // Stripe Transform (required for HTTP outcalls) =====================
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Stripe Functions ==================================================

  public query ({ caller }) func isStripeConfigured() : async Bool {
    if (not isAdminOrOwner(caller)) {
      Runtime.trap("Unauthorized: Admin/Owner only");
    };
    switch (stripeConfig) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not isAdminOrOwner(caller)) {
      Runtime.trap("Unauthorized: Admin/Owner only");
    };
    stripeConfig := ?config;
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    let config = switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe is not configured") };
      case (?c) { c };
    };
    await Stripe.createCheckoutSession(config, caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func getSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check session status");
    };
    let config = switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe is not configured") };
      case (?c) { c };
    };
    let status = await Stripe.getSessionStatus(config, sessionId, transform);
    switch (status) {
      case (#completed({ userPrincipal = ?principalText })) {
        let userPrincipal = Principal.fromText(principalText);
        switch (userProfiles.get(userPrincipal)) {
          case (null) {};
          case (?profile) {
            let updatedProfile : UserProfile = {
              username = profile.username;
              avatarUrl = profile.avatarUrl;
              bio = profile.bio;
              xp = profile.xp;
              level = profile.level;
              badges = profile.badges;
              isVIP = true;
              isBanned = profile.isBanned;
              role = profile.role;
            };
            userProfiles.add(userPrincipal, updatedProfile);
          };
        };
      };
      case (_) {};
    };
    status;
  };

  // User System Functions =============================================

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async UserProfile {
    if (not Principal.equal(caller, user) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    getUserOrTrap(user);
  };

  public query ({ caller }) func getAllUsersByUsername() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    userProfiles.values().toArray().sort(UserProfile.compareByUsername);
  };

  public shared ({ caller }) func banUser(user : Principal) : async () {
    if (not isAdminOrOwner(caller)) {
      Runtime.trap("Unauthorized: Admin/Owner only");
    };
    let profile = getUserOrTrap(user);
    let updatedProfile : UserProfile = {
      username = profile.username;
      avatarUrl = profile.avatarUrl;
      bio = profile.bio;
      xp = profile.xp;
      level = profile.level;
      badges = profile.badges;
      isVIP = profile.isVIP;
      isBanned = true;
      role = profile.role;
    };
    userProfiles.add(user, updatedProfile);
  };

  public shared ({ caller }) func unbanUser(user : Principal) : async () {
    if (not isAdminOrOwner(caller)) {
      Runtime.trap("Unauthorized: Admin/Owner only");
    };
    let profile = getUserOrTrap(user);
    let updatedProfile : UserProfile = {
      username = profile.username;
      avatarUrl = profile.avatarUrl;
      bio = profile.bio;
      xp = profile.xp;
      level = profile.level;
      badges = profile.badges;
      isVIP = profile.isVIP;
      isBanned = false;
      role = profile.role;
    };
    userProfiles.add(user, updatedProfile);
  };

  public shared ({ caller }) func assignVIP(user : Principal) : async () {
    if (not isAdminOrOwner(caller)) {
      Runtime.trap("Unauthorized: Admin/Owner only");
    };
    let profile = getUserOrTrap(user);
    let updatedProfile : UserProfile = {
      username = profile.username;
      avatarUrl = profile.avatarUrl;
      bio = profile.bio;
      xp = profile.xp;
      level = profile.level;
      badges = profile.badges;
      isVIP = true;
      isBanned = profile.isBanned;
      role = profile.role;
    };
    userProfiles.add(user, updatedProfile);
  };

  public shared ({ caller }) func assignAdminRole(user : Principal) : async () {
    if (not isOwner(caller)) {
      Runtime.trap("Unauthorized: Owner only");
    };
    AccessControl.assignRole(accessControlState, caller, user, #admin);
    let profile = getUserOrTrap(user);
    let updatedProfile : UserProfile = {
      username = profile.username;
      avatarUrl = profile.avatarUrl;
      bio = profile.bio;
      xp = profile.xp;
      level = profile.level;
      badges = profile.badges;
      isVIP = profile.isVIP;
      isBanned = profile.isBanned;
      role = #admin;
    };
    userProfiles.add(user, updatedProfile);
  };

  public shared ({ caller }) func setOwner() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin only");
    };
    switch (ownerPrincipal) {
      case (null) {
        ownerPrincipal := ?caller;
      };
      case (?_) {
        Runtime.trap("Owner already set");
      };
    };
  };

  public shared ({ caller }) func addXp(user : Principal, xp : Nat) : async () {
    if (not isAdminOrOwner(caller)) {
      Runtime.trap("Unauthorized: Admin/Owner only");
    };
    let profile = getUserOrTrap(user);
    let newXp = profile.xp + xp;
    let updatedProfile : UserProfile = {
      username = profile.username;
      avatarUrl = profile.avatarUrl;
      bio = profile.bio;
      xp = newXp;
      level = newXp / 1000;
      badges = profile.badges;
      isVIP = profile.isVIP;
      isBanned = profile.isBanned;
      role = profile.role;
    };
    userProfiles.add(user, updatedProfile);
  };

  // Chat System Functions =============================================

  public shared ({ caller }) func createRoom(name : Text, description : Text, isVIP : Bool) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };

    let roomId = nextRoomId;
    nextRoomId += 1;
    let room : ChatRoom = {
      roomId;
      name;
      description;
      isVIP;
      createdBy = caller;
    };
    chatRooms.add(roomId, room);
    roomId;
  };

  public shared ({ caller }) func deleteRoom(roomId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (chatRooms.get(roomId)) {
      case (null) { Runtime.trap("Room does not exist") };
      case (?_) {};
    };
  };

  public query ({ caller }) func getAllRooms() : async [ChatRoom] {
    chatRooms.values().toArray();
  };

  public shared ({ caller }) func postMessage(roomId : Nat, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can post messages");
    };

    if (isUserBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot post messages");
    };

    switch (chatRooms.get(roomId)) {
      case (null) { Runtime.trap("Room does not exist") };
      case (?room) {
        if (room.isVIP and not isUserVIP(caller)) {
          Runtime.trap("Unauthorized: VIP room access required");
        };

        let messageId = nextMessageId;
        nextMessageId += 1;

        let senderName = getUsername(caller);

        let message : ChatMessage = {
          messageId;
          roomId;
          sender = caller;
          senderName;
          content;
          timestamp = Time.now();
        };

        chatMessages.add(messageId, message);
      };
    };
  };

  public query ({ caller }) func getRecentMessages(roomId : Nat) : async [ChatMessage] {
    switch (chatRooms.get(roomId)) {
      case (null) { Runtime.trap("Room does not exist") };
      case (?room) {
        if (room.isVIP and not isUserVIP(caller) and not isAdminOrOwner(caller)) {
          Runtime.trap("Unauthorized: VIP room access required");
        };

        let messages = chatMessages.values().toArray();
        let roomMessages = messages.filter(func(msg) { msg.roomId == roomId });
        let len = roomMessages.size();
        let startIdx = if (len > 50) { len - 50 } else { 0 };
        roomMessages.sliceToArray(startIdx, len);
      };
    };
  };

  public shared ({ caller }) func sendPrivateMessage(receiver : Principal, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    if (isUserBanned(caller)) {
      Runtime.trap("Unauthorized: Banned users cannot send messages");
    };

    let message : PrivateMessage = {
      messageId = nextPrivateMessageId;
      sender = caller;
      receiver;
      content;
      timestamp = Time.now();
    };
    nextPrivateMessageId += 1;
    privateMessages.add(message);
  };

  public query ({ caller }) func getConversation(otherUser : Principal) : async [PrivateMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };

    let allMessages = privateMessages.toArray();
    allMessages.filter<PrivateMessage>(
      func(msg) {
        (Principal.equal(msg.sender, caller) and Principal.equal(msg.receiver, otherUser)) or
        (Principal.equal(msg.sender, otherUser) and Principal.equal(msg.receiver, caller))
      }
    );
  };

  // Game System Functions =============================================

  public shared ({ caller }) func submitScore(gameId : GameId, score : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit scores");
    };

    let username = getUsername(caller);
    let entry : LeaderboardEntry = {
      gameId;
      userId = caller;
      username;
      score;
      timestamp = Time.now();
    };

    switch (gameId) {
      case (#quiz) {
        let entryId = nextQuizEntryId;
        nextQuizEntryId += 1;
        quizLeaderboard.add(entryId, entry);
      };
      case (#racing) {
        let entryId = nextRacingEntryId;
        nextRacingEntryId += 1;
        racingLeaderboard.add(entryId, entry);
      };
      case (#shooting) {
        let entryId = nextShootingEntryId;
        nextShootingEntryId += 1;
        shootingLeaderboard.add(entryId, entry);
      };
    };
  };

  public query ({ caller }) func getLeaderboard(gameId : GameId) : async [LeaderboardEntry] {
    let entries = switch (gameId) {
      case (#quiz) { quizLeaderboard.values().toArray() };
      case (#racing) { racingLeaderboard.values().toArray() };
      case (#shooting) { shootingLeaderboard.values().toArray() };
    };

    let sorted = entries.sort(
      func(a, b) {
        if (a.score > b.score) { #less } else if (a.score < b.score) { #greater } else { #equal };
      }
    );

    let len = sorted.size();
    sorted.sliceToArray(0, Int.min(10, len).toNat());
  };

  public shared ({ caller }) func resetLeaderboard(gameId : GameId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };

    switch (gameId) {
      case (#quiz) {
        for ((key, _) in quizLeaderboard.entries()) {};
        nextQuizEntryId := 1;
      };
      case (#racing) {
        for ((key, _) in racingLeaderboard.entries()) {};
        nextRacingEntryId := 1;
      };
      case (#shooting) {
        for ((key, _) in shootingLeaderboard.entries()) {};
        nextShootingEntryId := 1;
      };
    };
  };

  // Admin Functions ===================================================

  public query ({ caller }) func getPlatformStats() : async PlatformStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };

    let totalUsers = userProfiles.size();
    let totalMessages = chatMessages.size() + privateMessages.size();

    let allEntries = quizLeaderboard.values().toArray().concat(
      racingLeaderboard.values().toArray().concat(
        shootingLeaderboard.values().toArray()
      )
    );

    let sorted = allEntries.sort(
      func(a, b) {
        if (a.score > b.score) { #less } else if (a.score < b.score) { #greater } else { #equal };
      }
    );

    let len = sorted.size();
    let topPlayers = sorted.sliceToArray(0, Int.min(10, len).toNat());

    {
      totalUsers;
      totalMessages;
      topPlayers;
    };
  };

  // AI Tools (Basic Templates) ========================================

  public query ({ caller }) func generateStory(genre : Text, prompt : Text) : async Text {
    let genreCapitalized = capitalize(genre);
    let promptCapitalized = capitalize(prompt);
    genreCapitalized # " Story: \n\nOnce upon a time, " # promptCapitalized #
    ".\nThis is a story set in the " # genre # " genre.";
  };

  public query ({ caller }) func generateTitles(topic : Text) : async [Text] {
    [
      "IC Revolution: " # topic,
      "NextGen Innovators: " # topic,
      "The Future of " # topic,
      topic # " 101",
      "AI Meets " # topic
    ];
  };
};
