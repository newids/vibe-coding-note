export interface User {
    id: string;
    name: string;
    avatar?: string;
    role: 'OWNER' | 'VISITOR';
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    color: string;
    description?: string;
    noteCount?: number;
}

export interface Tag {
    id: string;
    name: string;
    slug: string;
    noteCount?: number;
}

export interface Comment {
    id: string;
    content: string;
    noteId: string;
    authorId: string;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
    author: User;
    replies: Comment[];
}

export interface Note {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    authorId: string;
    categoryId: string;
    likeCount: number;
    published: boolean;
    createdAt: string;
    updatedAt: string;
    author: User;
    category: Category;
    tags: Tag[];
    comments?: Comment[];
    commentCount?: number;
}

export interface NotesResponse {
    notes: Note[];
    pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface CreateNoteData {
    title: string;
    content: string;
    categoryId: string;
    tagIds?: string[];
    published?: boolean;
}

export interface UpdateNoteData extends Partial<CreateNoteData> { }

export interface NotesFilters {
    search?: string;
    categoryId?: string;
    tagIds?: string;
    page?: number;
    limit?: number;
}