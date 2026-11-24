const characterList = document.querySelector('#character-list')
const characterCount = document.querySelector('#character-count')
const searchInput = document.querySelector('#search-input')
const houseFilter = document.querySelector('#house-filter')
const genderFilter = document.querySelector('#gender-filter')
const profile = document.querySelector('#character-profile')
const profileContent = document.querySelector('#profile-content')

const apiURL = 'https://www.anapioficeandfire.com/api/characters'

let allCharacters = []
let houseCache = {}

const getCharacters = (page = 1) => {

    characterList.innerHTML = '<p>Loading characters...</p>'

    fetch(`${apiURL}?page=${page}&pageSize=50`)
        .then(response => response.json())
        .then(characters => {

            allCharacters.push(...characters)

            if (characters.length == 50) {
                getCharacters(page + 1)
            }
            else {

                populateHouseFilter()
                displayCharacters(allCharacters)
                console.log('Characters loaded:', allCharacters.length)
            }

        })
        .catch(error => {
            console.log('API Error:', error)
            characterList.textContent = 'Unable to load characters.'
        })
}

const getHouseName = (url) => {

    if (!url) return Promise.resolve(null)

    if (houseCache[url]) return Promise.resolve(houseCache[url])

    return fetch(url)
        .then(response => response.json())
        .then(house => {

            houseCache[url] = house.name
            return house.name

        })
        .catch(error => {
            console.log(error)
            return null
        })
}

const populateHouseFilter = () => {

    const urls = [...new Set(
        allCharacters.flatMap(character => character.allegiances || [])
    )]

    Promise.all(urls.map(url =>
        getHouseName(url).then(name => ({ url, name }))
    ))
    .then(houses => {

        houses
            .filter(house => house.name)
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(house => {

                // Create an option for each house.
                let option = document.createElement('option')
                option.value = house.url
                option.textContent = house.name

                houseFilter.appendChild(option)
            })
    })
}

const displayCharacters = (characters) => {

    characterList.innerHTML = ''
    characterCount.textContent = `${characters.length} characters found`

    if (characters.length == 0) {
        characterList.textContent = 'No characters found.'
        return
    }

    characters.forEach(character => {

        let card = document.createElement('div')
        card.classList.add('character-card')

        let name = document.createElement('h2')
        name.textContent = character.name ||
            character.aliases?.find(alias => alias) ||
            'Unknown Character'

        let button = document.createElement('button')
        button.textContent = 'View Profile'
        button.classList.add('profile-button')

        button.addEventListener('click', () => {
            openProfile(character)
        })

        card.append(name, button)
        characterList.appendChild(card)
    })
}

const getRelatedInfo = (url) => {

    if (!url) return Promise.resolve(null)

    return fetch(url)
        .then(response => response.json())
        .catch(error => {
            console.log(error)
            return null
        })
}

const openProfile = (character) => {

    profile.showModal()
    profileContent.innerHTML = '<p>Loading character profile...</p>'

    const characterName = character.name ||
        character.aliases?.find(alias => alias) ||
        'Unknown Character'

    Promise.all([
        Promise.all((character.allegiances || []).map(getRelatedInfo)),
        getRelatedInfo(character.father),
        getRelatedInfo(character.mother),
        getRelatedInfo(character.spouse)
    ])
    .then(([houses, father, mother, spouse]) => {

        if (!profile.open) return

        profileContent.innerHTML = ''

        const addSection = (heading, value) => {

            if (!value || value === 'Unknown') return

            let section = document.createElement('div')
            section.classList.add('profile-section')

            let title = document.createElement('h3')
            title.textContent = heading

            let text = document.createElement('p')
            text.textContent = value

            section.append(title, text)
            profileContent.appendChild(section)
        }

        let name = document.createElement('h2')
        name.textContent = characterName
        name.classList.add('profile-name')
        profileContent.appendChild(name)

        addSection('Aliases', character.aliases?.filter(a => a).join(', '))
        addSection('Gender', character.gender)
        addSection('Culture', character.culture)
        addSection('Born', character.born)
        addSection('Died', character.died)
        addSection('Titles', character.titles?.filter(t => t).join(', '))

        addSection(
            'House Affiliations',
            houses.filter(house => house?.name).map(house => house.name).join(', ')
        )

        addSection('Father', father?.name)
        addSection('Mother', mother?.name)
        addSection('Spouse', spouse?.name)

        addSection('TV Series Appearances', character.tvSeries?.filter(s => s).join(', '))
        addSection('Played By', character.playedBy?.filter(a => a).join(', '))

        addSection(
            'Books',
            character.books?.length
                ? character.books.length + ' recorded book appearances'
                : ''
        )
    })
}

document.querySelector('#close-profile').addEventListener('click', () => {
    profile.close()
})

profile.addEventListener('click', event => {
    if (event.target.id === 'character-profile') {
        profile.close()
    }
})

const searchCharacters = () => {

    const search = searchInput.value.toLowerCase().trim()
    const house = houseFilter.value
    const gender = genderFilter.value.toLowerCase()

    const filtered = allCharacters.filter(character => {

        const info = [
            character.name,
            ...(character.aliases || []),
            ...(character.titles || []),
            ...(character.tvSeries || []),
            ...(character.playedBy || []),
            character.gender,
            character.culture
        ]

        const matchesSearch = info.some(item =>
            typeof item === 'string' && item.toLowerCase().includes(search)
        )

        const matchesHouse = !house ||
            (character.allegiances || []).includes(house)

        const matchesGender = !gender ||
            character.gender?.toLowerCase() === gender

        return matchesSearch && matchesHouse && matchesGender
    })

    displayCharacters(filtered)
}

searchInput.addEventListener('input', searchCharacters)
houseFilter.addEventListener('change', searchCharacters)
genderFilter.addEventListener('change', searchCharacters)

getCharacters()