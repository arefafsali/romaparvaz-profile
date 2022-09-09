export class gatewayCommission {
  constructor() { }
  public id: number = 0;
  public gatewayId: string = "";
  public includeAirlines: string[] = [];
  public domesticCommission: gatewayCommission_Commission = new gatewayCommission_Commission();
  public internationalCommission: gatewayCommission_Commission = new gatewayCommission_Commission();
  public serviceTypeId: number = 0;
  public isActive: boolean = false;
  public flightCountries: gatewayCommission_flightCountry[] = null;
}

export class flatGatewayCommission {
  public gatewayId: string = "";
  public airlineCode: string = "";
  public airline: object = null;
  public domesticCommission: gatewayCommission_flatCommission = new gatewayCommission_flatCommission();
  public internationalCommission: gatewayCommission_flatCommission = new gatewayCommission_flatCommission();
  public serviceTypeId: number = 0;
  public flightCountries: gatewayCommission_flightCountry[] = null;
}

export class gatewayCommission_Commission {
  public value: number = 0;
  public currencyId: string = "";
}

export class gatewayCommission_flatCommission extends gatewayCommission_Commission {
  public currency?: object = null;
}

export class gatewayCommission_flightCountry {
  public source: string = "";
  public destination: string[] = [];
}