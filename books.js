const bookList = document.querySelector('#book-list')
const bookSearch = document.querySelector('#book-search')
const bookCount = document.querySelector('#book-count')
const bookError = document.querySelector('#book-error')

const booksAPI = 'https://www.anapioficeandfire.com/api/books?page=1&pageSize=50'

let allBooks = []

const loadBooks = () => {
    fetch(booksAPI)
        .then(response => response.json())
        .then(books => {

            allBooks = books
            allBooks.sort((a, b) => new Date(a.released) - new Date(b.released))
            displayBooks(allBooks)

        })
        .catch(error => {
            console.log(error)
            bookError.textContent = 'Unable to load books. Please try again later.'
        })
}

const displayBooks = (books) => {

    bookList.innerHTML = ''
    bookCount.textContent = `${books.length} books found`

    if (books.length == 0) {
        bookList.textContent = 'No books found.'
        return
    }

    books.forEach(book => {

        let card = document.createElement('div')
        card.classList.add('book-card')

        let title = document.createElement('h2')
        title.textContent = book.name || 'Unknown Title'
        card.appendChild(title)

        const details = {
            'Author': book.authors?.join(', ') || 'Not recorded',
            'Released': formatDate(book.released),
            'Pages': book.numberOfPages || 'Not recorded',
            'Publisher': book.publisher || 'Not recorded',
            'ISBN': book.isbn || 'Not recorded',
            'Format': book.mediaType || 'Not recorded'
        }

        Object.entries(details).forEach(([label, value]) => {
            let p = document.createElement('p')
            let strong = document.createElement('strong')

            strong.textContent = `${label}: `
            p.append(strong, document.createTextNode(value))

            card.appendChild(p)
        })

        bookList.appendChild(card)
    })
}

const formatDate = (date) => {
    const formatted = new Date(date)

    return date && !isNaN(formatted.getTime())
        ? formatted.toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Not recorded'
}

bookSearch.addEventListener('input', () => {

    const search = bookSearch.value.toLowerCase()

    const filteredBooks = allBooks.filter(book =>
        [book.name, ...(book.authors || []), book.publisher]
            .some(value => value?.toLowerCase().includes(search))
    )

    displayBooks(filteredBooks)
})

loadBooks()