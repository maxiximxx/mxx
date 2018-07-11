self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('v1').then(function(cache) {
      return cache.addAll(['/', '/sw.html'])
    })
  )
})

self.addEventListener('fetch', function(event) {
  console.log(event.request)
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // caches.match() always resolves
      // but in case of success response will have value
      if (response !== undefined) {
        return response
      } else {
        return fetch(event.request)
          .then(function(response) {
            // response may be used only once
            // we need to save clone to put one copy in cache
            // and serve second one
            let responseClone = response.clone()

            caches.open('v1').then(function(cache) {
              cache.put(event.request, responseClone)
            })
            return response
          })
          .catch(function() {
            return false
          })
      }
    })
  )
})

self.addEventListener('activate', function(event) {
  // 声明缓存白名单，该名单内的缓存目录不会被生成
  var cacheWhitelist = ['v2']
  event.waitUntil(
    // 传给 waitUntil() 的 promise 会阻塞其他的事件，直到它完成
    // 确保清理操作会在第一次 fetch 事件之前完成
    caches.keys().then(function(keyList) {
      return Promise.all(
        keyList.map(function(key) {
          if (cacheWhitelist.indexOf(key) === -1) {
            return caches.delete(key)
          }
        })
      )
    })
  )
})
