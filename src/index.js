const path = require('path')
const dayjs = require('dayjs')
const { basename, extname } = require('path')
const fs = require('fs')
const os = require('os')
const md5 = require('md5');

async function fetch(ctx, url) {
  return await ctx
    .request({
      method: 'Get', url, encoding: null, headers: {
        'referer': refererUrl(url)
      }
    })
    .on('response', (response) => {
      const contentType = response.headers['content-type']
      if (!contentType.includes('image')) {
        ctx.log.error("headers:\n" + JSON.stringify(response.headers, null, 2))
        throw new Error(`${url} isn't a image, resp header ${response.headers}`)
      }
    })
}

function refererUrl(url) {
  urlParts = /^(https?:\/\/[^\/]+)([^\?]*)\??(.*)$/.exec(url);
  if (urlParts) {
    return urlParts[1]
  } else {
    return ''
  }
}
function imageFilename(url) {
  const _ = url.split('?')[0]
  return md5(_) + extName(_)
}

function timestampFilename() {
  const imagePath = path.join(os.tmpdir(), `${dayjs().format('YYYYMMDDHHmmss')}.png`)
  return imagePath
}

function extName(url) {
  const ret = extname(url)
  if (!ret) {
    ret = '.jpg'
  }
  return ret
}

async function handle(ctx) {

  if (ctx.input.length != 1 || !/https?:\/\//.test(ctx.input[0])) {
    return ctx
  }

  const imagePath = path.join(os.tmpdir(), imageFilename(ctx.input[0]))
  ctx.log.info("[plugin-url-input] Local image path:" + imagePath)
  let buffer = await fetch(ctx, ctx.input[0])
  fs.writeFileSync(imagePath, buffer)
  ctx.input = [imagePath]
  return ctx
}

module.exports = ctx => {
  const register = () => {
    ctx.helper.beforeTransformPlugins.register('url-input', { handle })
  }
  return {
    register
  }
}