var request = require("request");

export class SMSManager {
  static sendSMS(sourcePhoneIndx: number, phone: string, message: string) {
    return new Promise((resolve, eject) => {
      let sourcePhones = [
        "SimCard",
        "10002188",
        "30002176",
        "5000200022",
        "210001010101010",
        "50005708617166"
      ];
      var headers = {
        "User-Agent": "Super Agent/0.0.1",
        "Content-Type": "application/x-www-form-urlencoded"
      };
      var options = {
        url: "http://login.niazpardaz.ir/SMSInOutBox/Send",
        method: "POST",
        headers: headers,
        form: {
          UserName: "s.cheegel",
          Password: "1q2w3e4r",
          From: sourcePhones[sourcePhoneIndx],
          To: phone,
          Message: message
        }
      };
      request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) resolve(true);
        else eject(false);
      });
    });
  }
}
