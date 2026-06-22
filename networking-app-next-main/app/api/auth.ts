import { UserLogin, UserRegister, UserUpdate } from "../types";
import { instance as axios } from "./axiosInstance";

const login = (data: UserLogin) => axios.post("/users/login", data);
const register = (data: UserRegister) => axios.post("/users/register", data);

const updateUser = (data: UserUpdate, id: string) => axios.patch(`/users/update/${id}`, data);

const updateCvData = (id: string, cvData: string) => axios.patch(`/users/cv/${id}`, { cvData });

export { login, register, updateUser, updateCvData };
