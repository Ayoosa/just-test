import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.SUPABASE_CONFIG || {};
// Supabase client 会自行附加 /rest/v1。兼容误填 REST endpoint 的情况。
const projectUrl = String(config.url || '').trim().replace(/\/rest\/v1\/?$/, '');
const isConfigured = projectUrl && config.anonKey && !projectUrl.includes('YOUR_');
const supabase = isConfigured ? createClient(projectUrl, String(config.anonKey).trim()) : null;
const form = document.querySelector('#reviewForm');
const username = document.querySelector('#username');
const comment = document.querySelector('#comment');
const source = document.querySelector('#source');
const submitButton = document.querySelector('#submitButton');
const formMessage = document.querySelector('#formMessage');
const reviewsList = document.querySelector('#reviewsList');
const reviewCount = document.querySelector('#reviewCount');
const sortReviews = document.querySelector('#sortReviews');
const toast = document.querySelector('#successToast');
const ratingText = document.querySelector('#ratingText');
let star = 5;
let selectedTags = [];
const ratingLabels = { 1: '很失望', 2: '不太满意', 3: '还不错', 4: '很满意', 5: '超满意' };

function updateStars() {
  document.querySelectorAll('.star').forEach((button) => {
    const selected = Number(button.dataset.value) <= star;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-checked', String(Number(button.dataset.value) === star));
  });
  ratingText.textContent = ratingLabels[star];
}

document.querySelector('#starRating').addEventListener('click', (event) => {
  const button = event.target.closest('.star');
  if (!button) return;
  star = Number(button.dataset.value);
  updateStars();
});

document.querySelector('#tagList').addEventListener('click', (event) => {
  const button = event.target.closest('.review-tag');
  if (!button) return;
  const tag = button.dataset.tag;
  button.classList.toggle('active');
  selectedTags = selectedTags.includes(tag) ? selectedTags.filter((item) => item !== tag) : [...selectedTags, tag];
});

function starsMarkup(value) {
  return '★'.repeat(value) + '<span class="empty-stars">☆</span>'.repeat(5 - value);
}

function renderReviews(reviews) {
  reviewCount.textContent = reviews.length ? `${reviews.length} 条` : '';
  if (!reviews.length) {
    reviewsList.innerHTML = '<div class="empty">还没有评价，来成为第一个评价的人吧。</div>';
    return;
  }
  reviewsList.innerHTML = reviews.map((review) => {
    const rawName = review.username?.trim() || '匿名用户';
    const name = escapeHtml(rawName);
    const text = escapeHtml(review.comment || '');
    const tags = Array.isArray(review.tags) ? review.tags : [];
    const liked = localStorage.getItem(`amon-liked-${review.id}`) === 'true';
    return `<article class="review-item">
      <div class="review-head"><span class="review-name">${rawName === '匿名用户' ? '👤' : '🧐'} ${name}</span><span class="review-stars">${starsMarkup(Number(review.star) || 5)}</span></div>
      <p class="review-comment">${text}</p>
      ${tags.length ? `<div class="review-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
      <div class="review-bottom">
        <p class="source-status ${review.source ? 'yes' : ''}">${review.source ? '🜏 已将源堡作为小费赠与阿蒙' : '❌ 未提供源堡作为小费赠与阿蒙'}</p>
        <button class="like-button ${liked ? 'liked' : ''}" data-review-id="${review.id}" type="button" aria-pressed="${liked}">♥ ${Number(review.likes) || 0}</button>
      </div>
    </article>`;
  }).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

async function loadReviews() {
  if (!supabase) {
    reviewsList.innerHTML = '<div class="empty">请先在 config.js 中填写 Supabase 配置。</div>';
    return;
  }
  const orderColumn = sortReviews.value === 'popular' ? 'likes' : 'created_at';
  const { data, error } = await supabase.from('reviews').select('id, username, comment, star, tags, source, likes, created_at').order(orderColumn, { ascending: false }).order('created_at', { ascending: false });
  if (error) {
    reviewsList.innerHTML = '<div class="empty">评价加载失败，请稍后重试。</div>';
    return;
  }
  renderReviews(data || []);
}

sortReviews.addEventListener('change', loadReviews);

reviewsList.addEventListener('click', async (event) => {
  const button = event.target.closest('.like-button');
  if (!button || button.getAttribute('aria-pressed') === 'true' || !supabase) return;
  const reviewId = Number(button.dataset.reviewId);
  if (!Number.isInteger(reviewId)) return;
  button.disabled = true;
  const { error } = await supabase.rpc('increment_review_likes', { review_id: reviewId });
  if (error) {
    button.disabled = false;
    formMessage.textContent = '点赞失败，请稍后重试。';
    return;
  }
  localStorage.setItem(`amon-liked-${reviewId}`, 'true');
  button.classList.add('liked');
  button.setAttribute('aria-pressed', 'true');
  button.textContent = `♥ ${Number(button.textContent.replace(/\D/g, '')) + 1}`;
});

function showToast() {
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = '';
  const cleanName = username.value.trim();
  const cleanComment = comment.value.trim();
  if (!cleanName) { formMessage.textContent = '请输入用户名。'; username.focus(); return; }
  if (!cleanComment) { formMessage.textContent = '请输入评价内容。'; comment.focus(); return; }
  if (!supabase) { formMessage.textContent = 'Supabase 尚未配置，无法提交评价。'; return; }
  submitButton.disabled = true;
  submitButton.textContent = '提交中…';
  const payload = { username: cleanName, comment: cleanComment, star, tags: selectedTags, source: source.checked, created_at: new Date().toISOString() };
  const { error } = await supabase.from('reviews').insert(payload);
  submitButton.disabled = false;
  submitButton.textContent = '提交好评';
  if (error) { formMessage.textContent = `提交失败：${error.message}`; return; }
  form.reset();
  source.checked = true;
  star = 5;
  selectedTags = [];
  document.querySelectorAll('.review-tag').forEach((tag) => tag.classList.remove('active'));
  updateStars();
  showToast();
  loadReviews();
});

updateStars();
loadReviews();
