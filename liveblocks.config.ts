
import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { SyncedCanvasState, ChatMessage } from "@/types/collaboration";
import { LiveList, LiveObject } from "@liveblocks/client";

const client = createClient({
    publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "",
});

export type Presence = {
    cursor: { x: number; y: number } | null;
    info: {
        name: string;
        color: string;
        avatarEmoji: string;
        isHost: boolean;
    };
};

export type Storage = {
    canvas: LiveObject<SyncedCanvasState>;
    messages: LiveList<ChatMessage>;
};

export type UserMeta = {
    id: string;
    info: {
        name: string;
        color: string;
        avatarEmoji: string;
        isHost: boolean;
    };
};

export type RoomEvent = {
    type: "TOAST";
    message: string;
};

export const {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useSelf,
    useOthers,
    useOthersMapped,
    useOthersConnectionIds,
    useOther,
    useBroadcastEvent,
    useEventListener,
    useErrorListener,
    useStorage,
    useHistory,
    useUndo,
    useRedo,
    useCanUndo,
    useCanRedo,
    useMutation,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
