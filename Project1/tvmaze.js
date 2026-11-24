const episodeCount = document.querySelector('#episode-count')
const seasonSelect = document.querySelector('#season-select')
const episodeSearch = document.querySelector('#episode-search')
const showFilter = document.querySelector('#show-filter')
const episodeNumberFilter = document.querySelector('#episode-number-filter')

const shows = [
    { id: 82, name: 'Game of Thrones', container: 'got-episodes' },
    { id: 44778, name: 'House of the Dragon', container: 'hotd-episodes' },
    { id: 53063, name: 'A Knight of the Seven Kingdoms', container: 'knight-episodes' }
]

let allEpisodes = []

const getEpisodes = async () => {
    episodeCount.textContent = 'Loading episodes...'

    shows.forEach(show => {
        const container = document.querySelector(`#${show.container}`)
        if (container) container.innerHTML = '<p>Loading episodes...</p>'
    })

    const results = await Promise.allSettled(
        shows.map(async show => {
            const response = await fetch(
                `https://api.tvmaze.com/shows/${show.id}/episodes?specials=1`
            )

            if (!response.ok) {
                throw new Error(`${show.name}: HTTP ${response.status}`)
            }

            const episodes = await response.json()

            episodes.forEach(episode => {
                episode.showID = show.id
                episode.showName = show.name
            })

            return episodes
        })
    )

    allEpisodes = []

    results.forEach((result, index) => {
        const show = shows[index]

        if (result.status === 'fulfilled') {
            allEpisodes.push(...result.value)
        } else {
            console.error(`Could not load ${show.name}:`, result.reason)
            const container = document.querySelector(`#${show.container}`)
            if (container) {
                container.innerHTML = '<p>Episodes could not be loaded for this show.</p>'
            }
        }
    })

    allEpisodes.sort((a, b) => {
        if (a.showID !== b.showID) {
            return a.showID - b.showID
        }

        if (a.season !== b.season) {
            return a.season - b.season
        }

        return (a.number ?? 9999) - (b.number ?? 9999)
    })

    populateSeasons()
    filterEpisodes()

    if (allEpisodes.length === 0) {
        episodeCount.textContent =
            'No episodes could be loaded. Check your internet connection or try again later.'
    }

    console.log('Episodes loaded:', allEpisodes.length)
}

const populateSeasons = () => {
    seasonSelect.innerHTML = '<option value="all">All Seasons</option>'

    shows.forEach(show => {
        const seasons = [
            ...new Set(
                allEpisodes
                    .filter(episode => episode.showID === show.id)
                    .map(episode => episode.season)
            )
        ].sort((a, b) => a - b)

        if (seasons.length === 0) return

        const group = document.createElement('optgroup')
        group.label = show.name

        seasons.forEach(season => {
            const option = document.createElement('option')
            option.value = `${show.id}-${season}`
            option.textContent = `Season ${season}`
            group.appendChild(option)
        })

        seasonSelect.appendChild(group)
    })
}

const filterEpisodes = () => {
    const search = episodeSearch.value.toLowerCase().trim()
    const selectedShow = showFilter.value
    const selectedSeason = seasonSelect.value
    const selectedEpisode = episodeNumberFilter.value.trim()

    const filtered = allEpisodes.filter(episode => {
        const showMatch =
            selectedShow === 'all' ||
            String(episode.showID) === selectedShow

        const seasonMatch =
            selectedSeason === 'all' ||
            selectedSeason === `${episode.showID}-${episode.season}`

        const episodeMatch =
            selectedEpisode === '' ||
            String(episode.number ?? '').includes(selectedEpisode)

        const searchMatch = [
            episode.showName,
            episode.name,
            `season ${episode.season}`,
            `episode ${episode.number ?? 'special'}`,
            String(episode.season),
            String(episode.number ?? '')
        ].some(value =>
            value.toLowerCase().includes(search)
        )

        return showMatch && seasonMatch && episodeMatch && searchMatch
    })

    displayEpisodes(filtered)
}

const displayEpisodes = episodes => {
    episodeCount.textContent = `${episodes.length} episode(s) found`

    shows.forEach(show => {
        const container = document.querySelector(`#${show.container}`)
        const section = container.closest('.show-section')

        container.innerHTML = ''

        section.style.display =
            showFilter.value === 'all' ||
            showFilter.value === String(show.id)
                ? 'block'
                : 'none'

        const showEpisodes = episodes.filter(
            episode => episode.showID === show.id
        )

        if (showFilter.value !== 'all' &&
            showFilter.value !== String(show.id)) {
            return
        }

        if (showEpisodes.length === 0) {
            container.innerHTML = '<p>No episodes found.</p>'
            return
        }

        showEpisodes.forEach(episode => {
            const card = document.createElement('article')
            card.classList.add('episode-card')

            if (episode.image?.medium) {
                const image = document.createElement('img')
                image.src = episode.image.medium
                image.alt = `${episode.name} episode image`
                image.loading = 'lazy'
                card.appendChild(image)
            }

            const number = document.createElement('p')
            number.classList.add('episode-number')
            number.textContent =
                `Season ${episode.season} · Episode ${episode.number ?? 'Special'}`

            const title = document.createElement('h2')
            title.textContent = episode.name

            const airdate = document.createElement('p')
            airdate.textContent = episode.airdate
                ? new Date(episode.airdate + 'T00:00:00').toLocaleDateString(
                    'en-CA',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                )
                : 'Air date unavailable'

            const runtime = document.createElement('p')
            runtime.textContent = episode.runtime
                ? `${episode.runtime} minutes`
                : 'Runtime unavailable'

            const summary = document.createElement('p')
            summary.classList.add('episode-summary')
            summary.textContent = episode.summary
                ? episode.summary.replace(/<[^>]*>/g, '')
                : 'No episode description available.'

            const link = document.createElement('a')
            link.href = episode.url
            link.target = '_blank'
            link.rel = 'noopener noreferrer'
            link.textContent = 'View on TVmaze ↗'

            card.append(number, title, airdate, runtime, summary, link)
            container.appendChild(card)
        })
    })
}

episodeSearch.addEventListener('input', filterEpisodes)
showFilter.addEventListener('change', filterEpisodes)
seasonSelect.addEventListener('change', filterEpisodes)
episodeNumberFilter.addEventListener('input', filterEpisodes)

getEpisodes()