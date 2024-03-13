import React from 'react'
import VideoRoom from './VideoRoom'

const VideoCall = () => {
    const [joined, setJoined] = React.useState(false)
    return (
        <div className='app'>
            <h1>Social App Virtual Call</h1>
            {!joined && <button onClick={() => setJoined(true)}>Join Room</button>}
            {joined && <VideoRoom />}
        </div>
    )
}

export default VideoCall