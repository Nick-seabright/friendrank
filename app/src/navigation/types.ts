export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type RootStackParamList = {
  GroupsList: undefined;
  CreateJoinGroup: undefined;
  GroupHome: { groupId: string; groupName: string };
  LogPoint: { groupId: string; preselectedRecipientId?: string };
  GroupSettings: { groupId: string; groupName: string };
};

export type GroupTabParamList = {
  Leaderboard: undefined;
  Feed: undefined;
  Confirmations: undefined;
};
