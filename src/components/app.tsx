import { FC, useEffect, useState } from "react";
import { Message, initialMessages } from "../models/message";
import { ChatSettings } from "./chat-settings";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";
import { TitleBar } from "./title-bar";

export const App: FC = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(false);
  const [showChatList, setShowChatList] = useState<boolean>(false);

  useEffect(() => {
    async function test() {
      const m = await api.listMessages();
      console.log("messages", m);
    }

    test();
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 top-0">
      <div className="flex h-full">
        <div className="flex h-full w-full flex-1 flex-col">
          <div className="app-region flex-none border-b">
            <TitleBar
              showChatList={showChatList}
              setShowChatList={setShowChatList}
              showInfoPanel={showInfoPanel}
              setShowInfoPanel={setShowInfoPanel}
            />
          </div>

          {showInfoPanel && (
            <div className="w-1/3 border-l">
              <ChatSettings />
            </div>
          )}

          {/* FIXME: Ideally, the `overflow-hidden` isn't necessary here. This should be the concern of the `ScrollContainer` */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <MessageList messages={messages} />

            <div className="flex-none border-t p-3">
              <MessageComposer
                onSubmit={(content) =>
                  setMessages([
                    ...messages,
                    {
                      id: String(messages.length + 1),
                      author: "1",
                      content,
                      special: false,
                    },
                  ])
                }
              />
            </div>
          </div>
        </div>

        {showInfoPanel && (
          <div className="w-1/3 border-l">
            <ChatSettings />
          </div>
        )}
      </div>
    </div>
  );
};
