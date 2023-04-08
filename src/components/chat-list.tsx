import { FC, useState } from "react";
import { Chat, initialChats } from "../models/chat";

const ChatList: FC = () => {
  const [chats, setChats] = useState<Chat[]>(initialChats);

  return (
    <div className="flex flex-col gap-2">
      {chats.map((chat) => (
        <div className="border-b p-3" key={chat.id}>
          {chat.title}
        </div>
      ))}
    </div>
  );
};

export { ChatList };
