import { createSlice } from '@reduxjs/toolkit';

// 定义 state 的类型
interface UserInfoState {
  name: string;
  // playerName2: string;
  roomId: string;
}

const userInfoStore = createSlice({
  name: 'userInfo',
  initialState: {
    name: '',
    // playerName2: '',
    roomId: '',
  } as UserInfoState,
  reducers: {
    setName: (state: UserInfoState) => {
      state.name = localStorage.getItem('name') || '';
    },
    // setName2: (state: UserInfoState) => {
    //   state.playerName1 = localStorage.getItem('name2') || ''
    // },
    setRoomId: (state: UserInfoState) => {
      state.roomId = localStorage.getItem('roomId') || '';
    },
  },
});
// 导出 actions
export const { setName, setRoomId } = userInfoStore.actions;

const userReducer = userInfoStore.reducer;
// 导出 reducer
export default userReducer;
