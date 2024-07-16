import { useUser } from "@clerk/clerk-react";
import { ReactNode, createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addUser } from "../api/POST";
import { authUser } from "../api/auth/user";
import useSocket from "../hooks/useSocket";
import { Chat, THEME, User } from "../types/user";

interface UserContext {
    isAuth: boolean;
    setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
    userInfo: User | null;
    setUserInfo: React.Dispatch<React.SetStateAction<User | null>>;
    friendList: User[] | null;
    setFriendList: React.Dispatch<React.SetStateAction<User[] | null>>;
    userChats: Chat[] | null;
    setUserChats: React.Dispatch<React.SetStateAction<Chat[] | null>>;
}

export const UserDataContext = createContext<UserContext>({
    isAuth: false,
    setIsAuth: () => {},
    userInfo: null,
    setUserInfo: () => {},
    friendList: null,
    setFriendList: () => {},
    userChats: null,
    setUserChats: () => {},
});

export interface ResultData {
    userInfo: User;
    userChats: Chat[];
}

const UserDataProvider = ({ children }: { children: ReactNode }) => {
    const [isAuth, setIsAuth] = useState<boolean>(false);
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [friendList, setFriendList] = useState<User[] | null>(null);
    const [userChats, setUserChats] = useState<Chat[] | null>(null);

    const navigate = useNavigate();

    const { isSignedIn, user } = useUser();

    const { socket } = useSocket();

    useEffect(() => {
        const checkIfUserExist = async () => {
            console.log("auth");

            const res = await authUser(user?.emailAddresses[0].emailAddress);

            if (res.success && res.data) {
                setIsAuth(true);
                setUserInfo(res.data?.userInfo);
                setUserChats(res.data?.userChats);
                // navigate("/dashboard", { replace: true });
            } else {
                const userData: Omit<User, "id"> = {
                    name: user?.username || user?.fullName,
                    email: user?.emailAddresses[0].emailAddress,
                    Profile: {
                        image: user?.imageUrl,
                        theme: THEME.DARK,
                    },
                };
                const result = await addUser(userData);
                if (result.success) {
                    setIsAuth(true);
                    // navigate("/dashboard", { replace: true });
                }
            }
        };
        if (isSignedIn && !isAuth) checkIfUserExist();

        if (!isSignedIn) {
            console.log("signed out called ");

            socket?.disconnect();
            setIsAuth(false);
        }
    }, [user, navigate, isAuth, isSignedIn, socket]);

    useEffect(() => {}, [isSignedIn, user]);
    return (
        <UserDataContext.Provider
            value={{
                isAuth,
                setIsAuth,
                userInfo,
                setUserInfo,
                friendList,
                setFriendList,
                userChats,
                setUserChats,
            }}
        >
            {children}
        </UserDataContext.Provider>
    );
};

export default UserDataProvider;
