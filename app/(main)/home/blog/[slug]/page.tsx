'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { ArrowLeft, Calendar, User, Clock, Share2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  author: string;
  published_at: string;
  tags: string[];
  category: string;
}

function renderParagraph(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await getSupabase()
        .from('blog_posts')
        .select('*')
        .eq('slug', params.slug)
        .maybeSingle();
      setPost(data);

      if (data) {
        const { data: relatedData } = await getSupabase()
          .from('blog_posts')
          .select('*')
          .eq('category', data.category)
          .neq('slug', data.slug)
          .order('published_at', { ascending: false })
          .limit(3);
        setRelated(relatedData ?? []);
      }
      setLoading(false);
    }
    load();
  }, [params.slug]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatDateShort = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const estimateReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const sharePost = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.title, url }); } catch { navigator.clipboard.writeText(url); toast.success('Link copied'); }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in px-5 py-8">
        <div className="h-8 w-32 bg-cream-200 rounded animate-pulse mb-6" />
        <div className="h-52 bg-cream-200 rounded-xl animate-pulse mb-6" />
        <div className="space-y-3">
          <div className="h-6 bg-cream-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-cream-200 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-cream-200 rounded animate-pulse" />
          <div className="h-4 bg-cream-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-body text-muted-foreground">Article not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-ocean-500 font-semibold">
          Go back
        </button>
      </div>
    );
  }

  const renderContent = (content: string) => {
    const blocks = content.split('\n\n');
    return blocks.map((block, i) => {
      if (block.startsWith('## ')) {
        return (
          <h2 key={i} className="text-heading-sm font-semibold text-foreground pt-3">
            {block.replace('## ', '')}
          </h2>
        );
      }
      if (block.startsWith('### ')) {
        return (
          <h3 key={i} className="text-body font-semibold text-foreground pt-2">
            {block.replace('### ', '')}
          </h3>
        );
      }
      if (block.startsWith('> ')) {
        return (
          <blockquote key={i} className="border-l-3 border-ocean-300 pl-4 py-1 text-body-sm text-foreground/75 italic">
            {block.replace('> ', '')}
          </blockquote>
        );
      }
      if (block.startsWith('- ') || block.startsWith('* ')) {
        const items = block.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* '));
        return (
          <ul key={i} className="space-y-1.5 pl-5 list-disc marker:text-sage-400">
            {items.map((item, j) => (
              <li key={j} className="text-body-sm text-foreground/85 leading-relaxed">
                {renderParagraph(item.replace(/^[-*] /, ''))}
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p key={i} className="text-body-sm text-foreground/85 leading-relaxed">
          {renderParagraph(block)}
        </p>
      );
    });
  };

  return (
    <article className="animate-fade-in pb-8">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-ocean-500 font-medium text-body-sm hover:text-ocean-400 transition-colors"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <button
          onClick={sharePost}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-ocean-500 transition-colors p-2 -m-2"
        >
          <Share2 size={18} />
        </button>
      </div>

      {post.image_url && (
        <div className="relative h-56 w-full bg-ocean-50">
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
            priority
          />
        </div>
      )}

      <div className="px-5 pt-5 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {post.category && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-ocean-50 text-ocean-500">
              {post.category}
            </span>
          )}
          {post.tags.map((tag) => (
            <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sage-50 text-sage-700">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-heading-lg font-semibold text-foreground leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-[14px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User size={14} />
            {post.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {formatDate(post.published_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {estimateReadTime(post.content)} min read
          </span>
        </div>

        <div className="h-px bg-cream-300" />

        <div className="blog-content space-y-4">
          {renderContent(post.content)}
        </div>

        {related.length > 0 && (
          <section className="pt-4 space-y-3">
            <div className="h-px bg-cream-300" />
            <h2 className="text-heading-sm font-semibold text-foreground pt-2">
              More in {post.category}
            </h2>
            <div className="space-y-2.5">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/home/blog/${rel.slug}`}
                  className="flex gap-3.5 p-3 bg-white rounded-xl border border-cream-200 hover:shadow-sm transition-shadow"
                >
                  <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-ocean-50 flex-shrink-0">
                    {rel.image_url && (
                      <Image src={rel.image_url} alt={rel.title} fill className="object-cover" sizes="80px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-[14px] font-semibold text-foreground leading-snug line-clamp-2">
                      {rel.title}
                    </h4>
                    <span className="text-[12px] text-muted-foreground mt-1">
                      {formatDateShort(rel.published_at)}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 self-center" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
