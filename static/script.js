const mainUrl = "http://127.0.0.1:8000/api/v1/titles/";
const genresUrl = "http://127.0.0.1:8000/api/v1/genres/";
const defaultImage = "./static/image1.jpg";

async function checkImage(url) {
    try {
        let response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
            return url;
        } else {
            return defaultImage;
        }
    } catch {
        return defaultImage;
    }
}

async function getGenres() {
    let genreSelect = document.getElementById('genre-select');
    let genres = [];
    let url = genresUrl;

    try {
        while (url) {
            let response = await fetch(url);
            if (!response.ok) {
                throw new Error('il y a un Problème réseau ??');
            }
            let data = await response.json();
            genres = genres.concat(data.results);
            url = data.next;
        }

        genreSelect.innerHTML = '<option value="">Choisir un genre</option>';
        genres.forEach(genre => {
            let option = document.createElement('option');
            option.value = genre.name;
            option.text = genre.name;
            genreSelect.appendChild(option);
        });
    } catch (error) {
        console.log('Erreur genres:', error);
        genreSelect.innerHTML = '<option value="">Erreur</option>';
    }
}

async function getMovies(url, divId, start = 0, count = 6) {
    let div = document.getElementById(divId);
    let movies = [];

    try {
        let response = await fetch(url);
        if (!response.ok) {
            throw new Error('Problème réseau');
        }
        let data = await response.json();
        movies = movies.concat(data.results);

        if (data.next) {
            response = await fetch(data.next);
            if (!response.ok) {
                throw new Error('Problème réseau');
            }
            data = await response.json();
            movies = movies.concat(data.results);
        }

        div.innerHTML = '';
        let selectedMovies = movies.slice(start, start + count);
        if (selectedMovies.length === 0) {
            div.innerHTML = '<p>Aucun film trouvé.</p>';
            return;
        }

        for (let index = 0; index < selectedMovies.length; index++) {
            let movie = selectedMovies[index];
            let imageUrl = await checkImage(movie.image_url);
            let card = document.createElement('div');
            card.className = 'col';
            card.style.cursor = 'pointer';
            if (index >= (window.innerWidth < 576 ? 2 : 4) && window.innerWidth < 992) {
                card.classList.add('hidden');
            }
            card.innerHTML = `
                <div class="card h-100 text-center">
                    <img src="${imageUrl}" alt="${movie.title}" class="card-img-top mx-auto" style="max-width: 150px;" onerror="this.src='${defaultImage}'" onclick="openModal(${movie.id})">
                    <div class="card-body">
                        <p class="card-text">${movie.title}</p>
                    </div>
                </div>
            `;
            div.appendChild(card);
        }
    } catch (error) {
        console.log('Erreur films:', error);
        div.innerHTML = '<p>Erreur chargement films</p>';
    }
}

async function getBestMovie() {
    let title = document.getElementById('top-title');
    let image = document.getElementById('movie-image');
    let desc = document.getElementById('movie-description');

    try {
        let response = await fetch(mainUrl + "?page=1&sort_by=-imdb_score");
        if (!response.ok) {
            throw new Error('Problème réseau');
        }
        let data = await response.json();
        let movieId = data.results[0].id;

        response = await fetch(mainUrl + movieId);
        let movie = await response.json();

        let imageUrl = await checkImage(movie.image_url);
        title.innerHTML = movie.title;
        image.src = imageUrl;
        image.style.cursor = 'pointer';
        image.onerror = () => { image.src = defaultImage; };
        image.onclick = () => openModal(movieId);
        desc.innerHTML = movie.description || 'Pas de description';
    } catch (error) {
        console.log('Erreur meilleur film:', error);
    }
}

async function openModal(movieId) {
    let modal = document.getElementById('modal');
    let modalContent = document.getElementById('modal-content');

    try {
        let response = await fetch(mainUrl + movieId);
        if (!response.ok) {
            throw new Error('Problème réseau');
        }
        let movie = await response.json();

        let imageUrl = await checkImage(movie.image_url);
        modalContent.innerHTML = `
            <h3>${movie.title}</h3>
            <img src="${imageUrl}" alt="${movie.title}" class="img-fluid mx-auto d-block" style="max-width: 200px;" onerror="this.src='${defaultImage}'">
            <p><b>Genres:</b> ${movie.genres?.join(', ') || 'Inconnu'}</p>
            <p><b>Année:</b> ${movie.year || 'Inconnu'}</p>
            <p><b>Classement:</b> ${movie.rated || 'Inconnu'}</p>
            <p><b>Note IMDB:</b> ${movie.imdb_score || 'Inconnu'}</p>
            <p><b>Réalisateur:</b> ${movie.directors?.join(', ') || 'Inconnu'}</p>
            <p><b>Acteurs:</b> ${movie.actors?.join(', ') || 'Inconnu'}</p>
            <p><b>Durée:</b> ${movie.duration ? movie.duration + ' min' : 'Inconnu'}</p>
            <p><b>Pays:</b> ${movie.countries?.join(', ') || 'Inconnu'}</p>
            <p><b>Box-office:</b> ${movie.worldwide_gross_income ? `$${movie.worldwide_gross_income.toLocaleString()}` : 'Inconnu'}</p>
            <p><b>Résumé:</b> ${movie.description || 'Inconnu'}</p>
        `;
        modal.classList.remove('d-none');
        modal.classList.add('d-block');
    } catch (error) {
        console.log('Erreur modal:', error);
        modalContent.innerHTML = '<p>Erreur chargement</p>';
    }
}

function closeModal() {
    let modal = document.getElementById('modal');
    modal.classList.remove('d-block');
    modal.classList.add('d-none');
}

document.addEventListener('DOMContentLoaded', () => {
    getBestMovie();
    getMovies(mainUrl + "?page=1&sort_by=-imdb_score", 'top-movies', 1, 6);
    getMovies(mainUrl + "?genre=War&page=1&sort_by=-imdb_score", 'category-war', 0, 6);
    getMovies(mainUrl + "?genre=Horror&page=1&sort_by=-imdb_score", 'category-horror', 0, 6);
    getGenres();

    let genreSelect = document.getElementById('genre-select');
    genreSelect.addEventListener('change', (e) => {
        let genre = e.target.value;
        let div = document.getElementById('category-3');
        if (genre) {
            getMovies(mainUrl + "?genre=" + genre + "&page=1&sort_by=-imdb_score", 'category-3', 0, 6);
        } else {
            div.innerHTML = '<p>Sélectionnez un genre.</p>';
        }
    });

    // Gérer les boutons Voir plus/Voir moins
    document.querySelectorAll('.voir-plus').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            const films = document.querySelectorAll(`#${category} .col`);
            if (button.textContent === 'Voir plus') {
                films.forEach(film => film.classList.remove('hidden'));
                button.textContent = 'Voir moins';
            } else {
                films.forEach((film, index) => {
                    if (index >= (window.innerWidth < 576 ? 2 : 4)) {
                        film.classList.add('hidden');
                    }
                });
                button.textContent = 'Voir plus';
            }
        });
    });

    // Gérer le redimensionnement
    window.addEventListener('resize', () => {
        document.querySelectorAll('.voir-plus').forEach(button => {
            const category = button.dataset.category;
            const films = document.querySelectorAll(`#${category} .col`);
            if (window.innerWidth >= 992) {
                films.forEach(film => film.classList.remove('hidden'));
                button.style.display = 'none';
            } else {
                button.style.display = 'block';
                button.textContent = 'Voir plus';
                films.forEach((film, index) => {
                    if (index >= (window.innerWidth < 576 ? 2 : 4)) {
                        film.classList.add('hidden');
                    }
                });
            }
        });
    });
});
