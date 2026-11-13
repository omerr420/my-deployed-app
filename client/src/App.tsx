import { FormEvent, useEffect, useState } from "react";

type Post = { id: string; title: string; content: string; createdAt: string };
const API = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadPosts() {
    try {
      const response = await fetch(`${API}/api/posts`);
      if (!response.ok) throw new Error("Could not load posts.");
      setPosts(await response.json());
      setError("");
    } catch { setError("Unable to connect to the API. Please try again."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadPosts(); }, []);

  async function createPost(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(`${API}/api/posts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not publish post.");
      setPosts((current) => [data, ...current]);
      setTitle(""); setContent("");
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
  }

  async function deletePost(id: string) {
    try {
      const response = await fetch(`${API}/api/posts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete post.");
      setPosts((current) => current.filter((post) => post.id !== id));
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
  }

  return <main className="shell">
    <header className="hero">
      <div className="eyebrow">A SPACE FOR THOUGHTFUL STORIES</div>
      <h1>Ink <span>&</span> Ideas.</h1>
      <p>Notes, stories, and perspectives worth sharing.</p>
      <div className="hero-line" />
    </header>
    <section className="composer">
      <div className="section-heading"><div><span className="eyebrow">YOUR VOICE</span><h2>Write something</h2></div><span className="dot">● LIVE</span></div>
      <form onSubmit={createPost}>
        <label htmlFor="title">Title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Give your story a title" required />
        <label htmlFor="content">Your story</label>
        <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Start writing here..." rows={5} required />
        <button type="submit">Publish story <span>↗</span></button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
    <section className="feed">
      <div className="section-heading"><div><span className="eyebrow">THE JOURNAL</span><h2>Latest stories</h2></div><span className="count">{posts.length} STORIES</span></div>
      {loading ? <p className="muted">Loading stories…</p> : posts.length === 0 ? <div className="empty"><span>✳</span><h3>The page is yours.</h3><p>Publish the first story and start the conversation.</p></div> :
        <div className="posts">{posts.map((post) => <article className="post" key={post.id}>
          <div className="post-meta"><span>FIELD NOTES</span><time>{new Date(post.createdAt).toLocaleDateString()}</time></div>
          <h3>{post.title}</h3><p>{post.content}</p>
          <button className="delete" onClick={() => void deletePost(post.id)} aria-label={`Delete ${post.title}`}>Delete story ×</button>
        </article>)}</div>}
    </section>
    <footer>INK & IDEAS <span>BUILT TO SHARE</span></footer>
  </main>;
}