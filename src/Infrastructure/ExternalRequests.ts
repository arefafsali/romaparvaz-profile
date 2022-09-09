var request = require("request");
var axios = require("axios");

export class ExternalRequest {
  static syncPostRequest(
    url: string,
    body: any,
    method?: string,
    contentType?: string,
    cookie?: string
  ) {
    return new Promise((resolve, reject) => {
      if (method == undefined) method = "POST";
      if (contentType == undefined) contentType = "application/json";
      var headers = {
        "Content-Type": contentType
      };
      if (url.indexOf(process.env.MAIN_URL) >= 0) headers["internalauth"] = process.env.INTERNAL_SECRET;
      if (cookie) headers["cookie"] = cookie;
      axios({
        method: method,
        url: url,
        data: body,
        headers: headers
      }).then(response => resolve(response.data), error => reject(error));
    });
  }

  static callMultipleRequest(requestTemplates: RequestTemplate[]) {
    return new Promise((resolve, eject) => {
      let request_results = [];
      let callback_index = 0;
      var request_callback = (index, result) => {
        callback_index++;
        request_results[index] = result;
        if (callback_index == requestTemplates.length) {
          resolve(request_results);
        }
      };

      for (
        let request_index = 0;
        request_index < requestTemplates.length;
        request_index++
      ) {
        if (
          requestTemplates[request_index].method == "" ||
          requestTemplates[request_index].method.toLowerCase() == "get"
        ) {
          ExternalRequest.syncGetRequest(
            requestTemplates[request_index].url,
            requestTemplates[request_index].contentType
          ).then(result => request_callback(request_index, result));
        } else {
          ExternalRequest.syncPostRequest(
            requestTemplates[request_index].url,
            requestTemplates[request_index].body,
            requestTemplates[request_index].method,
            requestTemplates[request_index].contentType
          ).then(result => request_callback(request_index, result));
        }
      }
    });
  }

  static syncGetRequest(url: string, contentType?: string, cookie?: string) {
    return new Promise((resolve, reject) => {
      if (contentType == undefined) contentType = "application/json";
      var headers = {
        "Content-Type": contentType
      };
      if (url.indexOf(process.env.MAIN_URL) >= 0) headers["internalauth"] = process.env.INTERNAL_SECRET;
      if (cookie) headers["Cookie"] = cookie;
      var options = {
        url: url,
        method: "GET",
        headers: headers
      };
      request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) resolve(JSON.parse(body));
        else reject(error);
      });
    });
  }
}

export class RequestTemplate {
  constructor(
    _url: string,
    _body: any,
    _method?: string,
    _contentType?: string
  ) {
    this.url = _url;
    this.body = _body;
    this.method = _method;
    this.contentType = _contentType;
  }
  public url: string = "";
  public body: any = null;
  public method: string = "";
  public contentType: string = "";
}
