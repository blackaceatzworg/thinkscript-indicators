##########################################################
# vwap + internals signals
# displays buy / sell arrows depending on what side of 
# and if internals are breaking out
##########################################################

##########################################################
# breakout lookback
##########################################################
input candle_lookback = 20;

##########################################################
# vwap
##########################################################
input numDevDn = -2.0;
input numDevUp = 2.0;
input timeFrame = {default DAY, WEEK, MONTH};

def cap = GetAggregationPeriod();
def errorInAggregation =
    timeFrame == timeFrame.DAY and cap >= AggregationPeriod.WEEK or
    timeFrame == timeFrame.WEEK and cap >= AggregationPeriod.MONTH;
Assert(!errorInAggregation, "timeFrame should be not less than current chart aggregation period");

def yyyyMmDd = GetYYYYMMDD();
def periodIndx;
switch (timeFrame) {
case DAY:
    periodIndx = yyyyMmDd;
case WEEK:
    periodIndx = Floor((DaysFromDate(First(yyyyMmDd)) + GetDayOfWeek(First(yyyyMmDd))) / 7);
case MONTH:
    periodIndx = RoundDown(yyyyMmDd / 100, 0);
}
def isPeriodRolled = CompoundValue(1, periodIndx != periodIndx[1], yes);

def volumeSum;
def volumeVwapSum;
def volumeVwap2Sum;

if (isPeriodRolled) {
    volumeSum = volume;
    volumeVwapSum = volume * vwap;
    volumeVwap2Sum = volume * Sqr(vwap);
} else {
    volumeSum = CompoundValue(1, volumeSum[1] + volume, volume);
    volumeVwapSum = CompoundValue(1, volumeVwapSum[1] + volume * vwap, volume * vwap);
    volumeVwap2Sum = CompoundValue(1, volumeVwap2Sum[1] + volume * Sqr(vwap), volume * Sqr(vwap));
}
def price = volumeVwapSum / volumeSum;
def deviation = Sqrt(Max(volumeVwap2Sum / volumeSum - Sqr(price), 0));

plot VWAP = price;
VWAP.AssignValueColor(if VWAP[0] > VWAP[1] then Color.GREEN else Color.RED);
VWAP.SetPaintingStrategy(PaintingStrategy.DASHES);

##########################################################
# internals
##########################################################
input internals = "$ADSPD";
input minVolume = 1000;
def greenTick = close("$TICK") > open("$TICK");
def redTick = close("$TICK") < open("$TICK");

##########################################################
# momentum
##########################################################
def internalclose = close(internals);
def internalhigh = high(internals);
def internallow = low(internals);
input momolength = 12;
assert(momolength > 0, "'length' must be positive: " + momolength);

##########################################################
# candles
##########################################################
input Distance = 5;
def modDistance = Distance / 1000;
def currentDistance = close[0] * modDistance;
def greenBar = open < close;
def redBar = open > close;

##########################################################
# breakout
##########################################################
def bullBreakout = (internalclose[0] > Highest(internalhigh[1], candle_lookback));
def bearBreakout = (internalclose[0] < Lowest(internallow[1], candle_lookback));

##########################################################
# signals
##########################################################
plot bullish = (close[0] > VWAP) and (bullBreakout);
plot bearish = (close[0] < VWAP) and (bearBreakout);

bullish.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_UP);
bullish.SetDefaultColor(color.green);
bullish.SetLineWeight(2);
bearish.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_DOWN);
bearish.SetDefaultColor(color.red);
bearish.SetLineWeight(2);

addlabel(yes, "vwap + internals", color.magenta);