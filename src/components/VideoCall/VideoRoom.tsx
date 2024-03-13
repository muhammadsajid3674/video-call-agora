import React, { useState, useEffect } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import VideoPlayer from './VideoPlayer';

const APP_ID: string = 'a4dbf86b447f4b1fbcbd7ee34859744a';
const TOKEN: string = '007eJxTYPj0d1XPAx/NZysu3Ug6t30F9xLTT01nfcI5NVb/YXJbkZqtwJBokpKUZmGWZGJinmaSZJiWlJyUYp6aamxiYWppbmKSGGfyIbUhkJFBS7uKhZEBAkF8Lobi/OTMxBzdxIICBgYA+ssjkw==';
const CHANNEL: string = 'social-app';

AgoraRTC.setLogLevel(4);
let agoraCommandQueue: Promise<void> = Promise.resolve();

interface User {
    uid: number;
    audioTrack: IMicrophoneAudioTrack;
    videoTrack: ICameraVideoTrack;
    hasAudio?: boolean;
}

interface CreateAgoraClientProps {
    onVideoTrack: (user: User) => void;
    onAudioTrack: (user: User) => void;
    onUserDisconnect: (user: User) => void;
}

const createAgoraClient = ({ onVideoTrack, onAudioTrack, onUserDisconnect }: CreateAgoraClientProps): { disconnect: () => Promise<void>, connect: () => Promise<{ tracks: (IMicrophoneAudioTrack | ICameraVideoTrack)[], uid: string | number }> } => {
    const client: IAgoraRTCClient = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8"
    });

    let tracks: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [];

    const waitForConnectionState = (connectionState: string): Promise<void> => {
        return new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if (client.connectionState === connectionState) {
                    clearInterval(interval);
                    resolve();
                }
            }, 200);
        });
    };

    const connect = async (): Promise<{ tracks: (IMicrophoneAudioTrack | ICameraVideoTrack)[], uid: string | number }> => {
        await waitForConnectionState('DISCONNECTED');
        const uid: string | number = await client.join(APP_ID, CHANNEL, TOKEN, null);
        client.on("user-published", (user: User, mediaType) => {
            client.subscribe(user, mediaType).then(() => {
                if (mediaType === 'video') {
                    onVideoTrack(user);
                }
                if (mediaType === 'audio') {
                    onAudioTrack(user);
                }
            });
        });
        client.on("user-left", (user: User) => {
            onUserDisconnect(user);
        });
        tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        await client.publish(tracks);
        return { tracks, uid };
    };

    const disconnect = async (): Promise<void> => {
        await waitForConnectionState('CONNECTED');
        client.removeAllListeners();
        for (const track of tracks) {
            track.stop();
            track.close();
        }
        await client.unpublish(tracks);
        await client.leave();
    };

    return { disconnect, connect };
};

const VideoRoom: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [uid, setUid] = useState<number | null | string>(null);

    useEffect(() => {
        const onVideoTrack = (user: User) => {
            setUsers(prev => [...prev, user]);
        };

        const onAudioTrack = (user: User) => {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack.play();
            setUsers(prev => {
                return prev.map(User => {
                    if (User.uid === user.uid) {
                        return { ...User, audio: user.hasAudio };
                    }
                    return User;
                });
            });
        };

        const onUserDisconnect = (user: User) => {
            setUsers(prev => prev.filter((u) => u.uid !== user.uid));
        };

        const { connect, disconnect } = createAgoraClient({
            onVideoTrack, onAudioTrack, onUserDisconnect
        });

        const setup = async () => {
            const { tracks, uid } = await connect();
            console.log('tracks :>> ', tracks);
            setUid(uid);
            setUsers((prev) => [...prev, { uid, audioTrack: tracks[0], videoTrack: tracks[1] }]);
        };

        const cleanup = async () => {
            await disconnect();
            setUid(null);
            setUsers([]);
        };

        agoraCommandQueue = agoraCommandQueue.then(setup);

        return () => {
            agoraCommandQueue = agoraCommandQueue.then(cleanup);
        };
    }, []);

    console.log('users :>> ', users);

    return (
        <>
            {uid}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 200px)',
                    }}
                >
                    {users.map((user) => (
                        <VideoPlayer key={user.uid} user={user} />
                    ))}
                </div>
            </div>
        </>
    );
};

export default VideoRoom;