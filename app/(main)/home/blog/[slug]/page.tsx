'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSupabase } from '@/lib/supabase';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';

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

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await getSupabase()
        .from('blog_posts')
        .select('*')
        .eq('slug', params.slug)
        .maybeSingle();
      setPost(data);
      setLoading(false);
    }
    load();
  }, [params.slug]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const estimateReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
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
        <button
          onClick={() => router.back()}
          className="mt-4 text-ocean-500 font-semibold"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <article className="animate-fade-in pb-8">
      <div className="px-5 pt-4 pb-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-ocean-500 font-medium text-body-sm hover:text-ocean-400 transition-colors"
        >
          <ArrowLeft size={18} />
          Back
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
            <span
              key={tag}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sage-50 text-sage-700"
            >
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
          {post.content.split('\n\n').map((paragraph, i) => {
            if (paragraph.startsWith('## ')) {
              return (
                <h2
                  key={i}
                  className="text-heading-sm font-semibold text-foreground pt-3"
                >
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h3
                  key={i}
                  className="text-body font-semibold text-foreground pt-2"
                >
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            return (
              <p
                key={i}
                className="text-body-sm text-foreground/85 leading-relaxed"
              >
                {paragraph}
              </p>
            );
          })}
        </div>
      </div>
    </article>
  );
}
