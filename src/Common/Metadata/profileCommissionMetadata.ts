import { commissionRule_flatCommission, commissionRule_flatMarkup } from "./commissionRuleMetadata";
import { gatewayCommission_flatCommission } from "./gatewayCommissionMetadata";

export class profileCommission {
  constructor() { }
  public id: number = 0;
  public gatewayId: string = "";
  public profileTypeId: number = 0;
  public profileGradeId: number = 0;
  public profileId: number = 0;
  public buyerProfileId: number = 0;
  public commission: profileCommission_Commission = new profileCommission_Commission();
  public counterCommission: profileCommission_Commission = new profileCommission_Commission();
  public ownerCommission: profileCommission_Commission = new profileCommission_Commission();
  public markup: profileCommission_Markup = new profileCommission_Markup();
  public isSeller: boolean = false;
  public includeAirlines: string[] = [];
  public serviceTypeId: number = 0;
  public isActive: boolean = false;
  public fromCountryCode: string[] = [];
  public toCountryCode: string[] = [];
  public fromCityCode: string[] = [];
  public toCityCode: string[] = [];
  public startDate: Date = null;
  public endDate: Date = null;
}

export class flatProfileCommission {
  public gatewayId: string = "";
  public profileTypeId: number = 0;
  public profileGradeId: number = 0;
  public profileId: number = 0;
  public buyerProfileId: number = 0;
  public commission: profileCommission_flatCommission = new profileCommission_flatCommission();
  public counterCommission: profileCommission_flatCommission = new profileCommission_flatCommission();
  public markup: profileCommission_flatMarkup = new profileCommission_flatMarkup();
  public isSeller: boolean = false;
  public airlineCode: string = "";
  public airline: object = null;
  public serviceTypeId: number = 0;
  public commissionRule: flatProfileCommission_CommissionRule = new flatProfileCommission_CommissionRule();
  public ownerCommission: profileCommission_flatCommission = new profileCommission_flatCommission();
  public gatewayCommission: flatProfileCommission_GatewayCommission = new flatProfileCommission_GatewayCommission();
  public fromCountryCode: string[] = [];
  public toCountryCode: string[] = [];
  public fromCityCode: string[] = [];
  public toCityCode: string[] = [];
  public fromCountry: object[] = null;
  public toCountry: object[] = null;
  public fromCity: object[] = [];
  public toCity: object[] = [];
  public startDate: Date = null;
  public endDate: Date = null;
}

export class profileCommission_Commission {
  public value: number = 0;
  public currencyId: string = "";
  public isPoint: boolean = false;
}

export class profileCommission_flatCommission extends profileCommission_Commission {
  public currency?: object = null;
}

export class profileCommission_Markup {
  public value: number = 0;
  public currencyId: string = "";
}

export class profileCommission_flatMarkup extends profileCommission_Markup {
  public currency?: object = null;
}

export class flatProfileCommission_CommissionRule {
  public commission: commissionRule_flatCommission = new commissionRule_flatCommission();
  public counterCommission: commissionRule_flatCommission = new commissionRule_flatCommission();
  public markup: commissionRule_flatMarkup = new commissionRule_flatMarkup();
}

export class flatProfileCommission_GatewayCommission {
  public domesticCommission: gatewayCommission_flatCommission = new gatewayCommission_flatCommission();
  public internationalCommission: gatewayCommission_flatCommission = new gatewayCommission_flatCommission();
}