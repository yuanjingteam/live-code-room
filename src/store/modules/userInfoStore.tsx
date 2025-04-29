import { createSlice } from '@reduxjs/toolkit';

// 定义 state 的类型
interface UserInfoState {
  name: string;
  anotherName: string;
  roomId: string;
}

const userInfoStore = createSlice({
  name: 'userInfo',
  initialState: {
    name: '',
    anotherName: '',
    roomId: '',
  } as UserInfoState,
  reducers: {
    setName: (state: UserInfoState) => {
      state.name = sessionStorage.getItem('name') || '';
    },
    setAnotherName: (state: UserInfoState) => {
      state.anotherName = sessionStorage.getItem('anotherName') || '';
    },
    setRoomId: (state: UserInfoState) => {
      state.roomId = sessionStorage.getItem('roomId') || '';
    },
  },
});
// 导出 actions
export const { setName, setAnotherName, setRoomId } = userInfoStore.actions;

const userReducer = userInfoStore.reducer;
// 导出 reducer
export default userReducer;
