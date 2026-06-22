import { Room, RoomRequest } from "../types";
import { instance as axios } from "./axiosInstance";

const createRoom = (data: RoomRequest) => axios.post<Room>("/messages/rooms/create", data);

const listRoomsForUser = (userId: string) =>
  axios.get<Room[]>(`/messages/rooms/user/${userId}`);

export { createRoom, listRoomsForUser };
