const fs = require('fs')
const config = require('./config')
const logger = require('./logger')

const NeteaseCloudMusicApi = require('NeteaseCloudMusicApi')

module.exports = {
  _uid: -1,
  _cookie: '',
  async login (username, password, cachePath) {
    if (cachePath && fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath).toString())
      this._uid = data.uid
      this._cookie = data.cookie

      const result = await NeteaseCloudMusicApi.login_refresh({
        uid: this._uid,
        cookie: this._cookie
      })
      logger.debug(result.body)
      if (result.body.code === 200) {
        logger.info('Login succeed with cached cookie')
        return
      }
    }

    let result = await NeteaseCloudMusicApi.login_cellphone({
      phone: username,
      password
    })
    result = result.body
    logger.debug(result)

    if (result.code === 200 && result.profile) {
      logger.info('Login succeed')
      this._uid = result.profile.userId
      this._cookie = result.cookie
      fs.writeFileSync(cachePath, JSON.stringify({
        uid: this._uid,
        cookie: this._cookie
      }))
    } else {
      logger.error('Login failed')
      throw new Error(result.msg)
    }
  },

  async getUserPlaylist () {
    let result = await NeteaseCloudMusicApi.user_playlist({
      uid: this._uid,
      cookie: this._cookie
    })
    result = result.body
    logger.debug(result)

    return result.playlist
  },

  async getUserAlbum () {
    let result = await NeteaseCloudMusicApi.album_sublist({
      limit: 100,
      cookie: this._cookie
    })
    result = result.body
    logger.debug(result)

    return result.data
  },

  async getUserArtist () {
    let result = await NeteaseCloudMusicApi.artist_sublist({
      limit: 100,
      cookie: this._cookie
    })
    result = result.body
    logger.debug(result)

    return result.data
  },

  async getPlaylistInfo (playlistId) {
    let result = await NeteaseCloudMusicApi.playlist_detail({
      id: playlistId,
      cookie: this._cookie
    })
    result = result.body
    logger.debug(result)

    return result.playlist
  },

  async getAlbumInfo (albumId) {
    let result = await NeteaseCloudMusicApi.album({
      id: albumId,
      cookie: this._cookie
    })
    result = result.body
    logger.debug(result)

    return result
  },

  async getArtistTop (artistId) {
    let result = await NeteaseCloudMusicApi.artist_top_song({
      id: artistId,
      cookie: this._cookie
    })
    result = result.body
    logger.debug(result)

    return result
  },

  async getTrackInfo (trackId) {
    let result = await NeteaseCloudMusicApi.song_detail({
      ids: `${trackId}`,
      cookie: this._cookie
    })
    result = result.body
    logger.debug(result)

    return result.songs[0]
  },

  async getTrackUrl (trackId) {
    let result = await NeteaseCloudMusicApi.song_url({
      id: trackId,
      br: config('bitRate', 999000),
      cookie: this._cookie
    })
    result = result.body

    const trackUrl = result.data[0]
    if (!trackUrl || !trackUrl.url) {
      return null
    }

    return `${trackUrl.url}`
  },

  async getLyric (trackId) {
    let result = await NeteaseCloudMusicApi.lyric({
      id: trackId,
      cookie: this._cookie
    })
    result = result.body

    return result
  },

  async editPlaylist (op, playlistId, trackId) {
    let result = await NeteaseCloudMusicApi.playlist_tracks({
      cookie: this._cookie,
      op: op === 'add' ? 'add' : 'del',
      pid: playlistId,
      tracks: `${trackId}`
    })
    result = result.body

    return result
  }
}
