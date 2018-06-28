//事件循环

const axios = require('axios')
let a, b = false
axios.get('http://127.0.0.1:5000/api/good/categorys').then(data => {
  console.log('axios finished')
  b = true
})

function test2() {
  setTimeout(() => {
    console.log('async')
    b = true
  }, 100);
  for (let index = 0; index < 3000000000; index++) {
    if (!a) {
      console.log('a', index)
      a = true
    }
    if (b) {
      console.log('b', index)
    }
  }
  console.log('end')
}

test2()