export class SortAndFilterFieldHelper {
  public static generateJSONFieldName = (f) => {
    let dotIndex = f.lastIndexOf(".");
    return '"' + f.substring(0, dotIndex).replace(/[.]/g, '"."') + '"->\'' + f.substr(dotIndex + 1) + '\'';
  }
}