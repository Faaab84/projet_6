const mainUrl = "http://127.0.0.1:8000/api/v1/titles/";
const genresUrl = "http://127.0.0.1:8000/api/v1/genres/";
const defaultImage = "./static/image1.jpg";


// on vérifie si l'image est accessible, sinon on retourne l'image 1
async function checkImage(url) {
    try {
        let response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
            return url;
        }
        return defaultImage;
    } catch {
        return defaultImage;
    }
}

// on récupère la liste des genres depuis l'API et on remplit le menu déroulant
async function getGenres() {
    let genreSelect = document.getElementById('genre-select');
    let genres = [];
    let url = genresUrl;

    while (url) {
        let response = await fetch(url);
        let data = await response.json();
        for (let i = 0; i < data.results.length; i++) {
            genres.push(data.results[i]);
        }
        url = data.next;
    }

    genreSelect.innerHTML = '<option value="">Choisir un genre</option>';
    for (let i = 0; i < genres.length; i++) {
        let option = document.createElement('option');
        option.value = genres[i].name;
        option.text = genres[i].name;
        genreSelect.appendChild(option);
    }
}

// on récupère une liste de films depuis l'API et les affiche dans une section
async function getMovies(url, divId, start = 0, count = 6) {
    let div = document.getElementById(divId);
    let movies = [];

    let response = await fetch(url);
    let data = await response.json();
    for (let i = 0; i < data.results.length; i++) {
        movies.push(data.results[i]);
    }

    if (data.next) {
        response = await fetch(data.next);
        let nextData = await response.json();
        for (let i = 0; i < nextData.results.length; i++) {
            movies.push(nextData.results[i]);
        }
    }

    div.innerHTML = '';
    let selectedMovies = [];
    for (let i = start; i < start + count && i < movies.length; i++) {
        selectedMovies.push(movies[i]);
    }

    if (selectedMovies.length === 0) {
        div.innerHTML = '<p>Aucun film trouvé.</p>';
        return;
    }

    let htmlContent = '';
    for (let i = 0; i < selectedMovies.length; i++) {
        let movie = selectedMovies[i];
        let imageUrl = await checkImage(movie.image_url);
        let isHidden = (i >= (window.innerWidth < 576 ? 2 : 4) && window.innerWidth < 992) ? 'hidden' : '';
        htmlContent += `
            <div class="col ${isHidden}" style="cursor: pointer;">
                <div class="card h-100 text-center">
                    <img src="${imageUrl}" alt="${movie.title}" class="card-img-top mx-auto" style="max-width: 150px;" data-movie-id="${movie.id}">
                    <div class="card-body">
                        <p class="card-text">${movie.title}</p>
                    </div>
                </div>
            </div>
        `;
    }
    div.innerHTML = htmlContent;

    let images = document.querySelectorAll(`#${divId} img`);
    for (let i = 0; i < images.length; i++) {
        images[i].addEventListener('error', function() {
            this.src = defaultImage;
        });
        images[i].addEventListener('click', function() {
            let movieId = this.getAttribute('data-movie-id');
            openModal(movieId);
        });
    }
}

// on récupère le meilleur film avec le meilleur score IMDB et on l'affiche dans la section "Meilleur film"
async function getBestMovie() {
    let title = document.getElementById('top-title');
    let image = document.getElementById('movie-image');
    let desc = document.getElementById('movie-description');

    try {
        let response = await fetch(mainUrl + "?page=1&sort_by=-imdb_score");
        let data = await response.json();
        let movies = [];
        for (let i = 0; i < data.results.length; i++) {
            movies.push(data.results[i]);
        }

        if (movies.length > 0) {
            let movieId = movies[0].id;
            response = await fetch(mainUrl + movieId);
            let movie = await response.json();

            let imageUrl = await checkImage(movie.image_url);
            title.innerHTML = movie.title || 'Inconnu';
            image.src = imageUrl;
            image.style.cursor = 'pointer';
            image.addEventListener('error', function() {
                this.src = defaultImage;
            });
            image.addEventListener('click', function() {
                openModal(movieId);
            });
            desc.innerHTML = movie.description || 'Pas de description';
        } else {
            title.innerHTML = 'Erreur';
            desc.innerHTML = 'Aucun film trouvé';
        }
    } catch {
        title.innerHTML = 'Erreur';
        desc.innerHTML = 'Problème chargement';
    }
}

// on ouvre une fenetre popup avec les détails d'un film (titre, image, genres, etc.)
async function openModal(movieId) {
    let modal = document.getElementById('modal');
    let modalContent = document.getElementById('modal-content');

    try {
        let response = await fetch(mainUrl + movieId);
        let movie = await response.json();

        let genres = [];
        let directors = [];
        let actors = [];
        let countries = [];

        for (let i = 0; i < (movie.genres ? movie.genres.length : 0); i++) {
            genres.push(movie.genres[i]);
        }
        for (let i = 0; i < (movie.directors ? movie.directors.length : 0); i++) {
            directors.push(movie.directors[i]);
        }
        for (let i = 0; i < (movie.actors ? movie.actors.length : 0); i++) {
            actors.push(movie.actors[i]);
        }
        for (let i = 0; i < (movie.countries ? movie.countries.length : 0); i++) {
            countries.push(movie.countries[i]);
        }

        let imageUrl = await checkImage(movie.image_url);
        let durationText;
        switch (true) {
            case !!movie.duration:
                durationText = movie.duration + ' min';
                break;
            default:
                durationText = 'Inconnu';
                break;
        }

        let boxOfficeText;
        switch (true) {
            case !!movie.worldwide_gross_income:
                boxOfficeText = `$${movie.worldwide_gross_income.toLocaleString()}`;
                break;
            default:
                boxOfficeText = 'Inconnu';
                break;
        }

        modalContent.innerHTML = `
            <h3>${movie.title || 'Inconnu'}</h3>
            <img src="${imageUrl}" alt="${movie.title || 'Affiche'}" class="img-fluid mx-auto d-block" style="max-width: 200px;" data-movie-id="${movie.id}">
            <p><b>Genres:</b> ${genres.length > 0 ? genres.join(', ') : 'Inconnu'}</p>
            <p><b>Année:</b> ${movie.year || 'Inconnu'}</p>
            <p><b>Classement:</b> ${movie.rated || 'Inconnu'}</p>
            <p><b>Note IMDB:</b> ${movie.imdb_score || 'Inconnu'}</p>
            <p><b>Réalisateur:</b> ${directors.length > 0 ? directors.join(', ') : 'Inconnu'}</p>
            <p><b>Acteurs:</b> ${actors.length > 0 ? actors.join(', ') : 'Inconnu'}</p>
            <p><b>Durée:</b> ${durationText}</p>
            <p><b>Pays:</b> ${countries.length > 0 ? countries.join(', ') : 'Inconnu'}</p>
            <p><b>Box-office:</b> ${boxOfficeText}</p>
            <p><b>Résumé:</b> ${movie.description || 'Inconnu'}</p>
        `;
        modal.classList.remove('d-none');
        modal.classList.add('d-block');

        let closeButton = document.querySelector('#modal span.float-end');
        closeButton.style.cursor = 'pointer';
    } catch {
        modalContent.innerHTML = '<p>Erreur chargement</p>';
        modal.classList.remove('d-none');
        modal.classList.add('d-block');
    }

    let modalImage = document.querySelector('#modal img');
    if (modalImage) {
        modalImage.addEventListener('error', function() {
            this.src = defaultImage;
        });
    }
}
// on ferme le modal
function closeModal() {
    let modal = document.getElementById('modal');
    modal.classList.remove('d-block');
    modal.classList.add('d-none');
}
//on gere les evenements au demarrage de la page
document.addEventListener('DOMContentLoaded', () => {
    getBestMovie();
    getMovies(mainUrl + "?page=1&sort_by=-imdb_score", 'top-movies', 1, 6);
    getMovies(mainUrl + "?genre=War&page=1&sort_by=-imdb_score", 'category-war', 0, 6);
    getMovies(mainUrl + "?genre=Horror&page=1&sort_by=-imdb_score", 'category-horror', 0, 6);
    getGenres();

    let genreSelect = document.getElementById('genre-select');
    genreSelect.addEventListener('change', () => {
        let genre = genreSelect.value;
        let div = document.getElementById('category-3');
        if (genre) {
            getMovies(mainUrl + "?genre=" + genre + "&page=1&sort_by=-imdb_score", 'category-3', 0, 6);
        } else {
            div.innerHTML = '<p>Sélectionnez un genre.</p>';
        }
    });

    let buttons = [];
    let buttonElements = document.getElementsByClassName('voir-plus');
    for (let i = 0; i < buttonElements.length; i++) {
        buttons.push(buttonElements[i]);
    }

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', () => {
            let category = buttons[i].dataset.category;
            let films = [];
            let filmElements = document.querySelectorAll(`#${category} .col`);
            for (let j = 0; j < filmElements.length; j++) {
                films.push(filmElements[j]);
            }

            let action;
            switch (buttons[i].textContent) {
                case 'Voir plus':
                    action = 'show';
                    break;
                case 'Voir moins':
                    action = 'hide';
                    break;
                default:
                    action = 'show';
                    break;
            }

            if (action === 'show') {
                for (let j = 0; j < films.length; j++) {
                    films[j].classList.remove('hidden');
                }
                buttons[i].textContent = 'Voir moins';
            } else {
                for (let j = 0; j < films.length; j++) {
                    if (j >= (window.innerWidth < 576 ? 2 : 4)) {
                        films[j].classList.add('hidden');
                    }
                }
                buttons[i].textContent = 'Voir plus';
            }
        });
    }

    window.addEventListener('resize', () => {
        let buttons = [];
        let buttonElements = document.getElementsByClassName('voir-plus');
        for (let i = 0; i < buttonElements.length; i++) {
            buttons.push(buttonElements[i]);
        }

        for (let i = 0; i < buttons.length; i++) {
            let category = buttons[i].dataset.category;
            let films = [];
            let filmElements = document.querySelectorAll(`#${category} .col`);
            for (let j = 0; j < filmElements.length; j++) {
                films.push(filmElements[j]);
            }

            if (window.innerWidth >= 992) {
                for (let j = 0; j < films.length; j++) {
                    films[j].classList.remove('hidden');
                }
                buttons[i].style.display = 'none';
            } else {
                buttons[i].style.display = 'block';
                buttons[i].textContent = 'Voir plus';
                for (let j = 0; j < films.length; j++) {
                    if (j >= (window.innerWidth < 576 ? 2 : 4)) {
                        films[j].classList.add('hidden');
                    }
                }
            }
        }
    });
});
