var nodemailer = require("nodemailer");
import { google } from "googleapis";
const OAuth2 = google.auth.OAuth2;
var ejs = require("ejs");
var fs = require("fs");

export class EmailManager {
  static sendEMail(email: string, subject: string, body: string, attachments?: any) {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: this.createAuthObject()
    });

    var mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: subject,
      html: body
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
      transporter.close();
    });
  }

  static sendEMailByTemplate(template: string, email: string, subject: string, parameters?: any) {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: this.createAuthObject()
    });
    
    var template_html = fs.readFileSync(template, { encoding: "utf-8" });
    var render_html = ejs.render(template_html, parameters);

    var mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: subject,
      html: render_html
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
      transporter.close();
    });
  }

  private static createAuthObject() {
    const oauth2Client = new OAuth2(process.env.EMAIL_CLIENT_ID, process.env.EMAIL_CLIENT_SECRET, process.env.EMAIL_REDIRECT_URL);
    oauth2Client.setCredentials({ refresh_token: process.env.EMAIL_REFRESH_TOKEN });
    let accessToken = oauth2Client.getAccessToken();
    return {
      type: "OAuth2",
      user: process.env.EMAIL_USERNAME,
      clientId: process.env.EMAIL_CLIENT_ID,
      clientSecret: process.env.EMAIL_CLIENT_SECRET,
      refreshToken: process.env.EMAIL_REFRESH_TOKEN,
      accessToken: accessToken
    };
  }
}
