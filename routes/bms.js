class BMS{

    constructor(location,t_min,t_max,battery_remain){
        this.location=location;
        this.t_min=t_min;
        this.t_max=t_max;
        this.battery_remain=battery_remain;
    }

    DisconnectSituation = (predictData,location) => {
        return;
    }

    //함수의 인자로 모두 location이 들어갈 필요가 있나?
    HighTempLoc = location => {

    }
    LowTempLoc = location => {

    }
    LowSoc = location => {

    }
    HighSoc = location => {

    }
    EmergencySchedule = () => {

    }


}