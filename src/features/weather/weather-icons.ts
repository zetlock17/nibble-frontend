import blizzard from '@/assets/icons/weather/blizzard.png'
import clearDay from '@/assets/icons/weather/clear-day.png'
import clearNight from '@/assets/icons/weather/clear-night.png'
import cloudy from '@/assets/icons/weather/cloudy.png'
import downpour from '@/assets/icons/weather/downpour.png'
import drizzle from '@/assets/icons/weather/drizzle.png'
import fog from '@/assets/icons/weather/fog.png'
import freezingRain from '@/assets/icons/weather/freezing-rain.png'
import frost from '@/assets/icons/weather/frost.png'
import hail from '@/assets/icons/weather/hail.png'
import haze from '@/assets/icons/weather/haze.png'
import overcast from '@/assets/icons/weather/overcast.png'
import partlyCloudyDay from '@/assets/icons/weather/partly-cloudy-day.png'
import partlyCloudyNight from '@/assets/icons/weather/partly-cloudy-night.png'
import rain from '@/assets/icons/weather/rain.png'
import sleet from '@/assets/icons/weather/sleet.png'
import snow from '@/assets/icons/weather/snow.png'
import thunderstorm from '@/assets/icons/weather/thunderstorm.png'
import wind from '@/assets/icons/weather/wind.png'
import type { WeatherCondition } from './weather'

export const weatherIcons: Record<WeatherCondition, string> = {
  blizzard,
  'clear-day': clearDay,
  'clear-night': clearNight,
  cloudy,
  downpour,
  drizzle,
  fog,
  'freezing-rain': freezingRain,
  frost,
  hail,
  haze,
  overcast,
  'partly-cloudy-day': partlyCloudyDay,
  'partly-cloudy-night': partlyCloudyNight,
  rain,
  sleet,
  snow,
  thunderstorm,
  wind,
}
