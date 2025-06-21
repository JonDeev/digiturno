const jwt_decode = require('jwt-decode').default;

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
              'eyJ1c2VySWQiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3QiLCJleHAiOjQ3NjMzNjgwMDB9.' +
              'Z9RGgLCj3A7ZZ-5hxLE-dVyEm8UVSkQ9W9zXUqvVt8I';

const decoded = jwt_decode(token);
console.log(decoded);
