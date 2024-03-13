import React from 'react'

const VideoPlayer = ({ user }) => {
  const videoPlayerRef = React.useRef()
  React.useEffect(() => {
    user.videoTrack.play(videoPlayerRef.current)
    return () => {
      user.videoTrack.stop()
    }
  }, [])

  return (
    <div>
      UID: {user.uid}
      <div ref={videoPlayerRef} style={{ width: "200px", height: "200px" }}></div>
    </div>
  )
}

export default VideoPlayer