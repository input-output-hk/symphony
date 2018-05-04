'use strict'

export default class Detect {
  constructor () {
    this.undefined
    this.prefixes = 'Webkit Moz O ms'.split(' ')
    this.dummyStyle = document.createElement('div').style
    this.ua = (navigator.userAgent || navigator.vendor || window.opera).toLowerCase()
    this.videoFormat = this.testMediaFormat('video', ['video/mp4'])
    this.audioFormat = this.testMediaFormat('audio', ['audio/mp3'])

    this.isIFrame = window.self !== window.top

    this.isRetina = window.devicePixelRatio && window.devicePixelRatio >= 1.5
    this.isSupportOpacity = this.dummyStyle.opacity !== this.undefined

    this.isWindows = this.ua.indexOf('windows') > -1
    this.isMac = this.ua.indexOf('macintosh') > -1

    this.isChrome = this.ua.indexOf('chrome') > -1
    this.isChrome66 = this.ua.indexOf('chrome/66.') > -1
    this.isChrome67 = this.ua.indexOf('chrome/67.') > -1
    this.isChrome68 = this.ua.indexOf('chrome/68.') > -1
    this.isChrome69 = this.ua.indexOf('chrome/69.') > -1
    this.isFirefox = this.ua.indexOf('firefox') > -1
    this.isSafari = this.ua.indexOf('safari') > -1
    this.isEdge = this.ua.indexOf('edge') > -1
    this.isIE = this.ua.indexOf('msie') > -1

    this.isMobile = /(iPad|iPhone|Android)/i.test(this.ua)
    this.isIOS = /(iPad|iPhone)/i.test(this.ua)

    this.filterStyle = this.getStyleName('filter')
    this.transitionStyle = this.getStyleName('transition')
    this.transformStyle = this.getStyleName('transform')
    this.transform3dStyle = this.getStyleName('transform', 'perspective')
    this.transformPerspectiveStyle = this.getStyleName('perspective')
    this.transformOriginStyle = this.getStyleName('transformOrigin')
    if (this.isIE) {
      this.filterStyle = this.undefined
    }

    if (this.isEdge) {
      this.isChrome = this.isSafari = false
    }
  }

  // helpers
  testMediaFormat (type, orders) {
    var dom
    try {
      switch (type) {
        case 'video':
          dom = new window.Video()
          break
        case 'audio':
          dom = new window.Audio()
          break
        default:
      }
    } catch (e) {
      dom = document.createElement(type)
    }
    var format
    for (var i = 0, len = orders.length; i < len; i++) {
      if (dom.canPlayType && dom.canPlayType(orders[i])) {
        format = orders[i].substr(orders[i].indexOf('/') + 1)
        break
      }
    }
    return format
  }

  getStyleName (prop, refProp) {
    if (!refProp) refProp = prop

    return this.getPropFromIndex(prop, this.getPropIndex(refProp))
  }

  getPropIndex (prop) {
    var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1)
    var i = this.prefixes.length
    while (i--) {
      if (this.dummyStyle[this.prefixes[i] + ucProp] !== this.undefined) {
        return i + 2
      }
    }
    if (this.dummyStyle[prop] !== this.undefined) {
      return 1
    }
    return 0
  }

  getPropFromIndex (prop, index) {
    return index > 1 ? this.prefixes[index - 2] + prop.charAt(0).toUpperCase() + prop.slice(1) : index === 1 ? prop : false
  }
}
