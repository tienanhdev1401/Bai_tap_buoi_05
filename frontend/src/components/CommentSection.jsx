function CommentSection({ comments, commentContent, onCommentChange, onSubmit, submitting, formatDate }) {
  const getInitial = (name) => {
    if (!name) {
      return 'N';
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return 'N';
    }
    return trimmed.charAt(0).toUpperCase();
  };

  return (
    <section className="detail-panel detail-comments">
      <header className="detail-panel__header">
        <div className="detail-panel__title-group">
          <h2>Bình luận</h2>
          <span className="detail-panel__sub">Chia sẻ trải nghiệm mua sắm của bạn</span>
        </div>
        <span className="detail-panel__count">{comments.length}</span>
      </header>

      <form className="comment-form" onSubmit={onSubmit}>
        <div className="comment-form__avatar">B</div>
        <div className="comment-form__controls">
          <textarea
            rows={4}
            value={commentContent}
            onChange={onCommentChange}
            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
            disabled={submitting}
          />
          <div className="comment-form__footer">
            <span>Đội ngũ hỗ trợ sẽ phản hồi trong vòng 24 giờ.</span>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
            </button>
          </div>
        </div>
      </form>

      <ul className="comment-list">
        {comments.length === 0 && (
          <li className="comment-empty">Chưa có bình luận nào. Hãy là người đầu tiên!</li>
        )}
        {comments.map((item, index) => {
          const commentId = item._id || item.id || index;
          const authorName = item.user?.name || 'Người dùng';
          const initial = getInitial(authorName);
          return (
            <li key={commentId} className="comment-item">
              <div className="comment-item__avatar">{initial}</div>
              <div className="comment-item__body">
                <div className="comment-item__meta">
                  <strong>{authorName}</strong>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <p>{item.content}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default CommentSection;
