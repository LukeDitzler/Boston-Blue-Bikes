class BlueBikesModel {
  constructor(koop) {
    this.koop = koop
  }

  async getData(req, callback) {
    console.log('getData called', req.url)
    
    try {
      // Fetch both endpoints in parallel
      const [infoRes, statusRes] = await Promise.all([
        fetch('https://gbfs.bluebikes.com/gbfs/en/station_information.json'),
        fetch('https://gbfs.bluebikes.com/gbfs/en/station_status.json')
      ])

      const [infoJson, statusJson] = await Promise.all([
        infoRes.json(),
        statusRes.json()
      ])

      const stations = infoJson.data.stations
      const statusMap = {}

      // Index status records by station_id for O(1) lookup
      for (const s of statusJson.data.stations) {
        statusMap[s.station_id] = s
      }

      // Build GeoJSON features
      const features = stations.map(station => {
        const status = statusMap[station.station_id] || {}

        const bikesAvailable = status.num_bikes_available ?? 0
        const docksAvailable = status.num_docks_available ?? 0
        const totalDocks = station.capacity ?? (bikesAvailable + docksAvailable)
        const percentAvailable = totalDocks > 0
          ? Math.round((bikesAvailable / totalDocks) * 100)
          : 0

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [station.lon, station.lat]
          },
          properties: {
            station_id: station.station_id,
            name: station.name,
            capacity: totalDocks,
            bikes_available: bikesAvailable,
            docks_available: docksAvailable,
            percent_available: percentAvailable,
            is_renting: status.is_renting ?? null,
            is_returning: status.is_returning ?? null,
            last_reported: status.last_reported ?? null
          }
        }
      })

      const geojson = {
        type: 'FeatureCollection',
        features,
        metadata: {}
      }

      callback(null, geojson)

    } catch (err) {
      callback(err)
    }
  }
}

module.exports = BlueBikesModel