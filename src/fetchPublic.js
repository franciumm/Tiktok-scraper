// fetchPublic.js
import axios from 'axios'
import { URL } from 'url'

/**
 * Given a full TikTok video URL, call the
 * https://www.tiktok.com/node/share/video/{author}/{videoId}
 * endpoint and return the basic stats.
 */
export async function fetchPublicMetrics(videoUrl) {
  // parse out author and id
  const u = new URL(videoUrl)
  const parts = u.pathname.split('/')  // ["", "@alice", "video", "1234567890", ...]
  const authorSegment = parts.find(p => p.startsWith('@'))
  const author = authorSegment.replace(/^@/, '')
  const videoId = parts[parts.indexOf('video') + 1]

  const shareApi = `https://www.tiktok.com/node/share/video/${author}/${videoId}`
  const { data } = await axios.get(shareApi, {
    headers: {
      // use a real Chrome UA string
      'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64)
        AppleWebKit/537.36 (KHTML, like Gecko)
        Chrome/114.0.0.0 Safari/537.36`.replace(/\s+/g, ' ')
    }
  })

  const meta = data.body.itemInfo.itemStruct.stats
  const desc = data.body.itemInfo.itemStruct.desc

  return {
    videoUrl,
    title: desc,
    views:     meta.playCount,
    likes:     meta.diggCount,
    comments:  meta.commentCount,
    shares:    meta.shareCount,
    favorites: meta.collectCount
  }
}
