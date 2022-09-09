const bcrypt = require("bcrypt");
const saltRounds = 10;

export class Security {
  static hashText(text: string) {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(saltRounds).then((salt) => {
        bcrypt.hash(text, salt).then((result) => {
          resolve(result)
        }).catch((err) => {
          reject(err)
        });
      }).catch((err) => {
        reject(err)
      })
    })
  }

  static compareHash(
    text: string,
    hash: string,
  ) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(text, hash).then((result) => {
        resolve(result)
      }).catch((err) => {
        reject(err)
      });
    })
  }
}
