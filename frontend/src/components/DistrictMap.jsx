
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import api from '../services/api'
import 'leaflet/dist/leaflet.css'

import {
  MapPin, Info, Users, Award, TrendingUp,
  Layers, Compass, X,
} from 'lucide-react'

const PRIORITY_SCALE = [
  {
    title: 'Very High',
    range: 'Ranks 1–2',
    color: '#B52E4B',
    description: 'Highest relative assessed development need.',
  },
  {
    title: 'High',
    range: 'Ranks 3–5',
    color: '#E58B42',
    description: 'Elevated relative assessed development need.',
  },
  {
    title: 'Moderate',
    range: 'Ranks 6–8',
    color: '#247A9E',
    description: 'Mid-range relative assessed development need.',
  },
  {
    title: 'Low',
    range: 'Ranks 9–11',
    color: '#5C9FC6',
    description: 'Lower relative assessed development need.',
  },
  {
    title: 'Very Low',
    range: 'Ranks 12–13',
    color: '#B9D8EA',
    description: 'Lowest relative assessed development need.',
  },
]

const MAP_COLORS = {
  navy: '#172554',
  background: '#EDF3F7',
  boundary: '#FFFFFF',
  noData: '#94A3B8',
}

const normalizeName = (name) =>
  String(name || '').trim().toLowerCase()

const getDistrictRank = (district) => {
  if (!district || district.priority_rank == null) return NaN

  const rank = Number(district.priority_rank)

  return Number.isFinite(rank) && rank >= 1 && rank <= 13
    ? rank
    : NaN
}

const getDistrictColor = (rank) => {
  if (!Number.isFinite(rank)) return MAP_COLORS.noData
  if (rank <= 2) return '#B52E4B'
  if (rank <= 5) return '#E58B42'
  if (rank <= 8) return '#247A9E'
  if (rank <= 11) return '#5C9FC6'
  return '#B9D8EA'
}

const getPriorityLabel = (rank) => {
  if (!Number.isFinite(rank)) return 'Not ranked'
  if (rank <= 2) return 'Very High Assessed Need'
  if (rank <= 5) return 'High Assessed Need'
  if (rank <= 8) return 'Moderate Assessed Need'
  if (rank <= 11) return 'Low Assessed Need'
  return 'Very Low Assessed Need'
}

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A'
  }

  const number = Number(value)

  return Number.isFinite(number)
    ? number.toLocaleString('en-IN', { maximumFractionDigits: 2 })
    : 'N/A'
}

function FitDistrictBounds({ geoJson }) {
  const map = useMap()

  useEffect(() => {
    if (!geoJson?.features?.length) return

    const bounds = L.geoJSON(geoJson).getBounds()

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [28, 28],
        maxZoom: 8,
      })
    }
  }, [geoJson, map])

  return null
}

function MetricCard({
  title,
  value,
  explanation,
  icon: Icon,
  accent = 'navy',
}) {
  const accentStyles = {
    crimson: 'bg-rose-50 text-[#B52E4B] dark:bg-rose-950/40 dark:text-rose-300',
    blue: 'bg-sky-50 text-[#247A9E] dark:bg-sky-950/40 dark:text-sky-300',
    teal: 'bg-cyan-50 text-[#168C9B] dark:bg-cyan-950/40 dark:text-cyan-300',
    navy: 'bg-blue-50 text-[#172554] dark:bg-blue-950/40 dark:text-blue-200',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-[#111C30]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>

        {Icon && (
          <span className={`rounded-lg p-2 ${accentStyles[accent] || accentStyles.navy}`}>
            <Icon size={16} />
          </span>
        )}
      </div>

      <p className="mt-3 text-xl font-extrabold tracking-tight text-[#172554] dark:text-white">
        {value}
      </p>

      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {explanation}
      </p>
    </div>
  )
}

export default function DistrictMap() {
  const [geoJson, setGeoJson] = useState(null)
  const [districts, setDistricts] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [mapError, setMapError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadMapData = async () => {
      try {
        setLoading(true)
        setMapError('')

        const [geoResponse, districtResponse] = await Promise.all([
          fetch('/data/uttarakhand_districts.geojson'),
          api.get('/districts'),
        ])

        if (!geoResponse.ok) {
          throw new Error('Could not load the district boundary file.')
        }

        const geoData = await geoResponse.json()
        const districtData = districtResponse.data

        const districtList = Array.isArray(districtData)
          ? districtData
          : districtData?.districts || districtData?.data || []

        const uttarakhandFeatures = (geoData.features || []).filter(
          (feature) =>
            normalizeName(feature.properties?.stname) === 'uttarakhand'
        )

        if (uttarakhandFeatures.length !== 13) {
          throw new Error(
            `Expected 13 Uttarakhand districts, found ${uttarakhandFeatures.length}.`
          )
        }

        if (active) {
          setGeoJson({
            ...geoData,
            features: uttarakhandFeatures,
          })

          setDistricts(districtList)
        }
      } catch (error) {
        if (active) {
          setMapError(
            error.response?.data?.detail ||
            error.message ||
            'Unable to load map data.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMapData()

    return () => {
      active = false
    }
  }, [])

  const districtIndex = useMemo(() => {
    const index = new Map()

    districts.forEach((district) => {
      const name = district.district || district.name

      if (name) {
        index.set(normalizeName(name), district)
      }
    })

    return index
  }, [districts])

  const selectedData = selectedDistrict
    ? districtIndex.get(normalizeName(selectedDistrict))
    : null

  const rank = getDistrictRank(selectedData)

  const getFeatureData = (feature) =>
    districtIndex.get(normalizeName(feature.properties?.dtname))

  const mapStyle = (feature) => {
    const district = getFeatureData(feature)
    const districtRank = getDistrictRank(district)

    const isSelected =
      normalizeName(feature.properties?.dtname) ===
      normalizeName(selectedDistrict)

    return {
      fillColor: getDistrictColor(districtRank),
      weight: isSelected ? 3.5 : 1.6,
      opacity: 1,
      color: isSelected ? MAP_COLORS.navy : MAP_COLORS.boundary,
      fillOpacity: isSelected ? 0.98 : 0.88,
      lineCap: 'round',
      lineJoin: 'round',
    }
  }

  const onEachDistrict = (feature, layer) => {
    const name = feature.properties?.dtname || 'Unknown district'

    layer.bindTooltip(
      `<div class="govopt-map-tooltip">${name}</div>`,
      {
        sticky: true,
        direction: 'top',
        className: 'leaflet-gov-tooltip',
      }
    )

    layer.on({
      click: () => setSelectedDistrict(name),

      mouseover: (event) => {
        event.target.setStyle({
          weight: 3,
          color: MAP_COLORS.navy,
          fillOpacity: 1,
        })

        event.target.bringToFront()
      },

      mouseout: (event) => {
        const district = getFeatureData(feature)
        const districtRank = getDistrictRank(district)

        const isSelected =
          normalizeName(name) === normalizeName(selectedDistrict)

        event.target.setStyle({
          fillColor: getDistrictColor(districtRank),
          weight: isSelected ? 3.5 : 1.6,
          color: isSelected ? MAP_COLORS.navy : MAP_COLORS.boundary,
          fillOpacity: isSelected ? 0.98 : 0.88,
        })
      },
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[380px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-[#111C30]">
        <div className="space-y-3">
          <div className="skeleton mx-auto h-12 w-12 rounded-full" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Loading Uttarakhand district boundaries...
          </p>
        </div>
      </div>
    )
  }

  if (!geoJson) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
        <p className="text-sm font-bold">
          District map could not be loaded
        </p>
        <p className="mt-1 text-xs">{mapError}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#172554] text-white">
              <Compass size={17} />
            </span>

            <div>
              <h3 className="text-sm font-bold text-[#172554] dark:text-white">
                Uttarakhand District Priority Map
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Select a district to explore its model-assessed development needs.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-bold text-[#247A9E] dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300">
            <span className="h-2 w-2 rounded-full bg-[#247A9E]" />
            13 Districts Modelled
          </span>
        </div>

        <div className="relative overflow-hidden border-b border-slate-100 dark:border-slate-700">
          <MapContainer
            center={[30.1, 79.2]}
            zoom={7}
            scrollWheelZoom={false}
            style={{
              height: '490px',
              width: '100%',
              background: MAP_COLORS.background,
            }}
          >
            {/* Standard OpenStreetMap tiles: no CARTO API-key watermark */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <FitDistrictBounds geoJson={geoJson} />

            <GeoJSON
              key={selectedDistrict || 'all-districts'}
              data={geoJson}
              style={mapStyle}
              onEachFeature={onEachDistrict}
            />
          </MapContainer>
        </div>

        <div className="bg-white p-4 sm:p-5 dark:bg-[#111C30]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#172554] dark:text-white">
                Assessed Development Need
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Priority categories based on the model's district rankings.
              </p>
            </div>

            <span className="text-[10px] font-semibold text-slate-400">
              Higher assessed need →
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {PRIORITY_SCALE.slice().reverse().map((item) => (
              <div
                key={item.title}
                className="group overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/70 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/40"
              >
                <div
                  className="h-2.5 w-full"
                  style={{ backgroundColor: item.color }}
                />

                <div className="p-3">
                  <p className="text-xs font-extrabold text-[#172554] dark:text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-400">
                    {item.range}
                  </p>
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
            <Info size={14} className="mt-0.5 shrink-0 text-[#247A9E]" />
            <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
              These categories show relative model-assessed development need.
              They are not actual expenditure figures, statutory funding
              entitlements or final government allocation decisions.
            </p>
          </div>
        </div>
      </div>

      {mapError && (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
          Notice: {mapError}
        </p>
      )}

      {selectedDistrict ? (
        <div className="gov-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-[#B52E4B]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Selected District
                </p>
              </div>

              <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-[#172554] dark:text-white">
                {selectedDistrict}
              </h3>

              {selectedData && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                    style={{ backgroundColor: getDistrictColor(rank) }}
                  >
                    <Award size={13} />
                    Rank #{selectedData.priority_rank} · {getPriorityLabel(rank)}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedDistrict(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#B52E4B] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X size={14} />
              Clear selection
            </button>
          </div>

          {selectedData ? (
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Resource Need Rank"
                  value={`#${selectedData.priority_rank} of 13`}
                  explanation="Rank 1 represents the highest model-assessed need."
                  icon={Award}
                  accent="crimson"
                />

                <MetricCard
                  title="Assessed Need Score"
                  value={formatNumber(selectedData.revised_need_score)}
                  explanation="Composite normalized score used in the district assessment."
                  icon={TrendingUp}
                  accent="blue"
                />

                <MetricCard
                  title="Estimated Population"
                  value={formatNumber(selectedData.total_population)}
                  explanation="Projected district population used in model calculations."
                  icon={Users}
                  accent="navy"
                />

                <MetricCard
                  title="State Population Share"
                  value={`${formatNumber(selectedData.population_share_percent)}%`}
                  explanation="Share of Uttarakhand's estimated total population."
                  icon={Layers}
                  accent="teal"
                />
              </div>

              <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
                <h4 className="flex items-center gap-2 text-xs font-extrabold text-[#172554] dark:text-sky-300">
                  <Info size={14} />
                  District Assessment Summary
                </h4>

                <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {selectedDistrict} is ranked{' '}
                  <strong>#{selectedData.priority_rank} among 13 districts</strong>,
                  with a model-assessed development need score of{' '}
                  <strong>{formatNumber(selectedData.revised_need_score)}</strong>.
                  It accounts for approximately{' '}
                  <strong>{formatNumber(selectedData.population_share_percent)}%</strong>
                  {' '}of the state's estimated population.
                </p>
              </div>
            </div>
          ) : (
            <div className="m-5 rounded-xl bg-amber-50 p-4 text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              No indicator record was returned for this district.
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
          <Info size={17} className="mt-0.5 shrink-0 text-[#247A9E]" />
          <div>
            <p className="text-xs font-bold text-[#172554] dark:text-white">
              Explore a district
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Select any district on the map to inspect its assessed priority,
              need score, population and comparative position across Uttarakhand.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
