export class commissionRule {
  constructor() { }
  public id: number = 0;
  public profileTypeId: number = 0;
  public profileGradeId: number = 0;
  public profileGrades: any = {};
  public profileTypes: any = {};
  public gatewayId: string = "";
  public includeAirlines: string[] = [];
  public commission: commissionRule_Commission = new commissionRule_Commission();
  public counterCommission: commissionRule_Commission = new commissionRule_Commission();
  public ownerCommission: commissionRule_Commission = new commissionRule_Commission();
  public markup: commissionRule_Markup = new commissionRule_Markup();
  public serviceTypeId: number = 0;
  public isActive: boolean = false;
}
export class flatCommissionRule {
  public profileTypeId: number = 0;
  public profileGradeId: number = 0;
  public profileGrades: any = {};
  public profileTypes: any = {};
  public gatewayId: string = "";
  public airlineCode: string = "";
  public airline: object = null;
  public commission: commissionRule_flatCommission = new commissionRule_flatCommission();
  public counterCommission: commissionRule_flatCommission = new commissionRule_flatCommission();
  public ownerCommission: commissionRule_flatCommission = new commissionRule_flatCommission();
  public markup: commissionRule_flatMarkup = new commissionRule_flatMarkup();
  public serviceTypeId: number = 0;
}

export class commissionRule_Commission {
  public value: number = 0;
  public currencyId: string = "";
  public isPoint: boolean = false;
}

export class commissionRule_flatCommission extends commissionRule_Commission {
  public currency?: object = null;
}

export class commissionRule_Markup {
  public value: number = 0;
  public currencyId: string = "";
}

export class commissionRule_flatMarkup extends commissionRule_Markup {
  public currency?: object = null;
}
