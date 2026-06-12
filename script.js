// ── Storage helpers ──────────────────────────────────────────────
function getBooks() {
  try {
    const data = localStorage.getItem('books');
    if (data) return JSON.parse(data);
  } catch (e) { /* localStorage unavailable */ }

  // Default seed data
  const defaults = [
    { id: 1, title: "The Great Gatsby",      author: "F. Scott Fitzgerald", isbn: "978-0-7432-7356-5", price: 18.99, discount: 10, image: "images/book1.png" },
    { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee",          isbn: "978-0-0619-3546-9", price: 15.99, discount: 0,  image: "images/book2.png" },
    { id: 3, title: "1984",                  author: "George Orwell",        isbn: "978-0-4523-2893-4", price: 14.99, discount: 20, image: "images/book3.png" },
    { id: 4, title: "Pride and Prejudice",   author: "Jane Austen",          isbn: "978-0-1430-7278-0", price: 12.99, discount: 5,  image: "images/book4.png" }
  ];
  saveBooks(defaults);
  return defaults;
}

function saveBooks(books) {
  try {
    localStorage.setItem('books', JSON.stringify(books));
  } catch (e) {
    showToast('Storage full. Try removing a book image.', 'error');
  }
}

function getNextId() {
  const books = getBooks();
  return books.length ? Math.max(...books.map(b => b.id)) + 1 : 1;
}

// ── Price helper ─────────────────────────────────────────────────
function finalPrice(price, discount) {
  const d = parseFloat(discount) || 0;
  const p = parseFloat(price) || 0;
  return (p * (1 - d / 100)).toFixed(2);
}

// ── Toast ────────────────────────────────────────────────────────
function showToast(msg, type) {
  type = type || 'success';
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  // double rAF ensures transition fires after class is applied
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      toast.classList.add('show');
    });
  });
  setTimeout(function () { toast.classList.remove('show'); }, 3000);
}

// ── INDEX PAGE ───────────────────────────────────────────────────
function loadBooks() {
  var container = document.getElementById('book-list');
  if (!container) return;

  var books = getBooks();

  // Stats
  var totalEl = document.getElementById('stat-total');
  var avgEl   = document.getElementById('stat-avg');
  if (totalEl) totalEl.textContent = books.length;
  if (avgEl) {
    if (books.length > 0) {
      var sum = 0;
      for (var i = 0; i < books.length; i++) {
        sum += parseFloat(finalPrice(books[i].price, books[i].discount));
      }
      avgEl.textContent = '$' + (sum / books.length).toFixed(2);
    } else {
      avgEl.textContent = '$0.00';
    }
  }

  if (books.length === 0) {
    container.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">📚</div>' +
        '<p>No books yet. Add your first book!</p>' +
      '</div>';
    return;
  }

  var html = '';
  for (var j = 0; j < books.length; j++) {
    var book = books[j];
    var fp   = finalPrice(book.price, book.discount);
    var disc = parseFloat(book.discount) || 0;

    var badgeHtml    = disc > 0 ? '<span class="badge-discount">' + disc + '% OFF</span>' : '';
    var origHtml     = disc > 0 ? '<span class="price-orig">$' + parseFloat(book.price).toFixed(2) + '</span>' : '';

    html +=
      '<div class="book-card" id="card-' + book.id + '">' +
        '<img src="' + book.image + '" alt="' + book.title + '" onerror="this.src=\'images/book1.png\'">' +
        '<div class="book-info">' +
          '<h2>' + book.title + '</h2>' +
          '<p class="author">' + book.author + '</p>' +
          '<p class="isbn">ISBN: ' + book.isbn + '</p>' +
          '<div class="price-row">' +
            '<span class="price-final">$' + fp + '</span>' +
            origHtml + badgeHtml +
          '</div>' +
        '</div>' +
        '<div class="card-actions">' +
          '<a class="btn-update" href="update.html?id=' + book.id + '">✏️ Edit</a>' +
          '<button class="btn-delete" onclick="confirmDelete(' + book.id + ')">🗑️ Delete</button>' +
        '</div>' +
      '</div>';
  }
  container.innerHTML = html;
}

// ── DELETE ───────────────────────────────────────────────────────
var pendingDeleteId = null;

function confirmDelete(id) {
  pendingDeleteId = id;
  var overlay = document.getElementById('confirmModal');
  if (overlay) overlay.classList.add('active');
}

function cancelDelete() {
  pendingDeleteId = null;
  var overlay = document.getElementById('confirmModal');
  if (overlay) overlay.classList.remove('active');
}

function executeDelete() {
  if (pendingDeleteId === null) return;
  var books = getBooks();
  var book  = null;
  for (var i = 0; i < books.length; i++) {
    if (books[i].id === pendingDeleteId) { book = books[i]; break; }
  }
  var remaining = books.filter(function (b) { return b.id !== pendingDeleteId; });
  saveBooks(remaining);
  pendingDeleteId = null;
  var overlay = document.getElementById('confirmModal');
  if (overlay) overlay.classList.remove('active');
  loadBooks();
  showToast((book ? '"' + book.title + '"' : 'Book') + ' deleted.', 'success');
}

// ── ADD PAGE ─────────────────────────────────────────────────────
function setupAddPage() {
  var imgInput = document.getElementById('image');
  if (!imgInput) return;   // not on add page

  imgInput.addEventListener('change', function () {
    var file    = this.files[0];
    var preview = document.getElementById('imagePreview');
    if (!file || !preview) return;

    // Warn if image > 1 MB (localStorage limit protection)
    if (file.size > 1048576) {
      showToast('Image is large (>1MB). It may not save properly.', 'error');
    }
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
  });
}

function saveBook() {
  var title    = document.getElementById('title').value.trim();
  var author   = document.getElementById('author').value.trim();
  var isbn     = document.getElementById('isbn').value.trim();
  var priceVal = document.getElementById('price').value.trim();
  var discVal  = document.getElementById('discount').value.trim();
  var price    = parseFloat(priceVal);
  var discount = discVal === '' ? 0 : parseFloat(discVal);
  var imgFile  = document.getElementById('image').files[0];

  if (!title || !author || !isbn || priceVal === '' || isNaN(price) || price < 0) {
    showToast('Please fill in Title, Author, ISBN and a valid Price.', 'error');
    return;
  }
  if (isNaN(discount) || discount < 0 || discount > 100) {
    showToast('Discount must be a number between 0 and 100.', 'error');
    return;
  }

  function doSave(imageSrc) {
    var books   = getBooks();
    var newBook = { id: getNextId(), title: title, author: author, isbn: isbn, price: price, discount: discount, image: imageSrc };
    books.push(newBook);
    saveBooks(books);
    showToast('"' + title + '" added successfully!', 'success');
    setTimeout(function () { window.location.href = 'index.html'; }, 1200);
  }

  if (imgFile) {
    var reader = new FileReader();
    reader.onload = function (e) { doSave(e.target.result); };
    reader.readAsDataURL(imgFile);
  } else {
    doSave('images/book1.png');
  }
}

// ── UPDATE PAGE ──────────────────────────────────────────────────
function setupUpdatePage() {
  var formDiv = document.getElementById('updateBookForm');
  if (!formDiv) return;   // not on update page

  var params = new URLSearchParams(window.location.search);
  var id     = parseInt(params.get('id'), 10);

  if (isNaN(id)) {
    showToast('No book selected.', 'error');
    setTimeout(function () { window.location.href = 'index.html'; }, 1500);
    return;
  }

  var books = getBooks();
  var book  = null;
  for (var i = 0; i < books.length; i++) {
    if (books[i].id === id) { book = books[i]; break; }
  }

  if (!book) {
    showToast('Book not found.', 'error');
    setTimeout(function () { window.location.href = 'index.html'; }, 1500);
    return;
  }

  // Pre-fill
  document.getElementById('updateTitle').value    = book.title;
  document.getElementById('updateAuthor').value   = book.author;
  document.getElementById('updateIsbn').value     = book.isbn;
  document.getElementById('updatePrice').value    = book.price;
  document.getElementById('updateDiscount').value = book.discount;

  // Show current cover
  var preview = document.getElementById('updateImagePreview');
  if (preview && book.image) {
    preview.src = book.image;
    preview.style.display = 'block';
  }

  // Live preview on new file pick
  var imgInput = document.getElementById('updateImage');
  if (imgInput) {
    imgInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 1048576) {
        showToast('Image is large (>1MB). It may not save properly.', 'error');
      }
      if (preview) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
      }
    });
  }

  // Store book id on the div for updateBook() to read
  formDiv.dataset.bookId = id;
}

function updateBook() {
  var formDiv  = document.getElementById('updateBookForm');
  var id       = parseInt(formDiv.dataset.bookId, 10);
  var title    = document.getElementById('updateTitle').value.trim();
  var author   = document.getElementById('updateAuthor').value.trim();
  var isbn     = document.getElementById('updateIsbn').value.trim();
  var priceVal = document.getElementById('updatePrice').value.trim();
  var discVal  = document.getElementById('updateDiscount').value.trim();
  var price    = parseFloat(priceVal);
  var discount = discVal === '' ? 0 : parseFloat(discVal);
  var imgFile  = document.getElementById('updateImage').files[0];

  if (!title || !author || !isbn || priceVal === '' || isNaN(price) || price < 0) {
    showToast('Please fill in Title, Author, ISBN and a valid Price.', 'error');
    return;
  }
  if (isNaN(discount) || discount < 0 || discount > 100) {
    showToast('Discount must be a number between 0 and 100.', 'error');
    return;
  }
  if (isNaN(id)) {
    showToast('Could not identify book. Please go back and try again.', 'error');
    return;
  }

  var books = getBooks();
  var idx   = -1;
  for (var i = 0; i < books.length; i++) {
    if (books[i].id === id) { idx = i; break; }
  }
  if (idx === -1) {
    showToast('Book not found.', 'error');
    return;
  }

  function doSave(imageSrc) {
    books[idx] = { id: id, title: title, author: author, isbn: isbn, price: price, discount: discount, image: imageSrc };
    saveBooks(books);
    showToast('"' + title + '" updated!', 'success');
    setTimeout(function () { window.location.href = 'index.html'; }, 1200);
  }

  if (imgFile) {
    var reader = new FileReader();
    reader.onload = function (e) { doSave(e.target.result); };
    reader.readAsDataURL(imgFile);
  } else {
    doSave(books[idx].image);
  }
}

// ── Bootstrap ────────────────────────────────────────────────────
window.onload = function () {
  loadBooks();
  setupAddPage();
  setupUpdatePage();
};
