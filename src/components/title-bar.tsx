import { FC } from "react";

interface Props {
  setShowChatList: (showChatList: boolean) => void;
  setShowInfoPanel: (showInfoPanel: boolean) => void;
  showChatList: boolean;
  showInfoPanel: boolean;
}

const TitleBar: FC<Props> = ({ showInfoPanel, setShowInfoPanel }) => {
  return (
    <div className="flex items-center px-3">
      <div className="flex-none">
        <div className="flex gap-3">
          <div className="w-[55px]" />

          <div className="app-region">
            <button
              className="block"
              onClick={() => setShowInfoPanel(!showInfoPanel)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12.75 4.75h4.5a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2h-4.5m-8-2V6.75a2 2 0 0 1 2-2h2.5v14.5h-2.5a2 2 0 0 1-2-2Z"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 p-3 text-center text-gray-500">GPT-3.5</div>
      <div className="app-region flex-none">
        <button
          className="block"
          onClick={() => setShowInfoPanel(!showInfoPanel)}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M4.75 8H7.25"
            ></path>
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12.75 8H19.25"
            ></path>
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M4.75 16H12.25"
            ></path>
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M17.75 16H19.25"
            ></path>
            <circle
              cx="10"
              cy="8"
              r="2.25"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            ></circle>
            <circle
              cx="15"
              cy="16"
              r="2.25"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            ></circle>
          </svg>
        </button>
      </div>
    </div>
  );
};

export { TitleBar };
