##########################################################
# vwap + hull signals
# displays buy arrows when hull is turning up and price
# is above vwap (vice versa)
##########################################################

##########################################################
# vwap
##########################################################

input numDevDn = -2.0;
input numDevUp = 2.0;
input timeFrame = {default DAY, WEEK, MONTH};

def cap = getAggregationPeriod();
def errorInAggregation =
    timeFrame == timeFrame.DAY and cap >= AggregationPeriod.WEEK or
    timeFrame == timeFrame.WEEK and cap >= AggregationPeriod.MONTH;
assert(!errorInAggregation, "timeFrame should be not less than current chart aggregation period");

def yyyyMmDd = getYyyyMmDd();
def periodIndx;
switch (timeFrame) {
case DAY:
    periodIndx = yyyyMmDd;
case WEEK:
    periodIndx = Floor((daysFromDate(first(yyyyMmDd)) + getDayOfWeek(first(yyyyMmDd))) / 7);
case MONTH:
    periodIndx = roundDown(yyyyMmDd / 100, 0);
}
def isPeriodRolled = compoundValue(1, periodIndx != periodIndx[1], yes);

def volumeSum;
def volumeVwapSum;
def volumeVwap2Sum;

if (isPeriodRolled) {
    volumeSum = volume;
    volumeVwapSum = volume * vwap;
    volumeVwap2Sum = volume * Sqr(vwap);
} else {
    volumeSum = compoundValue(1, volumeSum[1] + volume, volume);
    volumeVwapSum = compoundValue(1, volumeVwapSum[1] + volume * vwap, volume * vwap);
    volumeVwap2Sum = compoundValue(1, volumeVwap2Sum[1] + volume * Sqr(vwap), volume * Sqr(vwap));
}
def price = volumeVwapSum / volumeSum;
def deviation = Sqrt(Max(volumeVwap2Sum / volumeSum - Sqr(price), 0));

plot VWAP = price;
VWAP.setDefaultColor(getColor(0));

##########################################################
# hull
##########################################################
input length = 20;
input displace = 0;

plot HMA = MovingAverage(AverageType.HULL, price, length)[-displace];

HMA.DefineColor("Up", GetColor(1));
HMA.DefineColor("Down", GetColor(0));
HMA.AssignValueColor(if HMA > HMA[1] then HMA.color("Up") else HMA.color("Down"));

##########################################################
# signals
##########################################################

plot bullish =  (close > VWAP) and (close > HMA) and (HMA > HMA[1]) and (HMA[1] < HMA[2]) and (close > open);
plot bearish =  (close < VWAP) and (close < HMA) and (HMA < HMA[1]) and (HMA[1] > HMA[2]) and (close < open);

Alert(bullish, "LONG!", Alert.BAR, Sound.Ding);
Alert(bearish, "SHORT!", Alert.BAR, Sound.Ding);

bullish.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_UP);
bullish.AssignValueColor(color.green);
bullish.SetLineWeight(3);

bearish.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_DOWN);
bearish.AssignValueColor(color.red);
bearish.SetLineWeight(3);

addlabel(yes, "vwap + hull", color.magenta);