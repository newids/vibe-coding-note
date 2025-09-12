import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:3001/api'

export const handlers = [
    // Auth endpoints
    http.post(`${API_BASE_URL}/auth/login`, () => {
        return HttpResponse.json({
            success: true,
            data: {
                user: {
                    id: 'test-user-id',
                    email: 'test@example.com',
                    name: 'Test User',
                    role: 'VISITOR'
                },
                token: 'mock-jwt-token'
            }
        })
    }),

    http.post(`${API_BASE_URL}/auth/register`, () => {
        return HttpResponse.json({
            success: true,
            data: {
                user: {
                    id: 'new-user-id',
                    email: 'newuser@example.com',
                    name: 'New User',
                    role: 'VISITOR'
                },
                token: 'mock-jwt-token'
            }
        })
    }),

    http.get(`${API_BASE_URL}/auth/me`, ({ request }) => {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return HttpResponse.json(
                { success: false, error: { code: 'NO_TOKEN', message: 'No token provided' } },
                { status: 401 }
            )
        }

        return HttpResponse.json({
            success: true,
            data: {
                user: {
                    id: 'test-user-id',
                    email: 'test@example.com',
                    name: 'Test User',
                    role: 'VISITOR'
                }
            }
        })
    }),

    // Notes endpoints
    http.get(`${API_BASE_URL}/notes`, () => {
        return HttpResponse.json({
            success: true,
            data: {
                notes: [
                    {
                        id: 'note-1',
                        title: 'Test Note 1',
                        content: 'This is test note content',
                        excerpt: 'Test excerpt',
                        slug: 'test-note-1',
                        authorId: 'test-user-id',
                        categoryId: 'category-1',
                        likeCount: 5,
                        published: true,
                        createdAt: '2024-01-01T00:00:00Z',
                        updatedAt: '2024-01-01T00:00:00Z',
                        author: {
                            id: 'test-user-id',
                            name: 'Test User',
                            email: 'test@example.com'
                        },
                        category: {
                            id: 'category-1',
                            name: 'JavaScript',
                            slug: 'javascript',
                            color: '#F7DF1E'
                        },
                        tags: [
                            {
                                id: 'tag-1',
                                name: 'React',
                                slug: 'react'
                            }
                        ]
                    }
                ],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 1,
                    totalPages: 1
                }
            }
        })
    }),

    http.get(`${API_BASE_URL}/notes/:id`, ({ params }) => {
        const { id } = params
        return HttpResponse.json({
            success: true,
            data: {
                note: {
                    id,
                    title: 'Test Note Detail',
                    content: 'This is detailed note content',
                    excerpt: 'Test excerpt',
                    slug: 'test-note-detail',
                    authorId: 'test-user-id',
                    categoryId: 'category-1',
                    likeCount: 5,
                    published: true,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                    author: {
                        id: 'test-user-id',
                        name: 'Test User',
                        email: 'test@example.com'
                    },
                    category: {
                        id: 'category-1',
                        name: 'JavaScript',
                        slug: 'javascript',
                        color: '#F7DF1E'
                    },
                    tags: [
                        {
                            id: 'tag-1',
                            name: 'React',
                            slug: 'react'
                        }
                    ],
                    comments: [
                        {
                            id: 'comment-1',
                            content: 'Great article!',
                            authorId: 'visitor-id',
                            noteId: id,
                            createdAt: '2024-01-01T01:00:00Z',
                            author: {
                                id: 'visitor-id',
                                name: 'Visitor',
                                email: 'visitor@example.com'
                            }
                        }
                    ]
                }
            }
        })
    }),

    http.post(`${API_BASE_URL}/notes/:id/like`, ({ params }) => {
        return HttpResponse.json({
            success: true,
            data: {
                likeCount: 6
            }
        })
    }),

    // Comments endpoints
    http.get(`${API_BASE_URL}/notes/:noteId/comments`, ({ params }) => {
        return HttpResponse.json({
            success: true,
            data: {
                comments: [
                    {
                        id: 'comment-1',
                        content: 'Great article!',
                        authorId: 'visitor-id',
                        noteId: params.noteId,
                        createdAt: '2024-01-01T01:00:00Z',
                        author: {
                            id: 'visitor-id',
                            name: 'Visitor',
                            email: 'visitor@example.com'
                        }
                    }
                ]
            }
        })
    }),

    http.post(`${API_BASE_URL}/notes/:noteId/comments`, ({ request }) => {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return HttpResponse.json(
                { success: false, error: { code: 'NO_TOKEN', message: 'No token provided' } },
                { status: 401 }
            )
        }

        return HttpResponse.json({
            success: true,
            data: {
                comment: {
                    id: 'new-comment-id',
                    content: 'New comment content',
                    authorId: 'test-user-id',
                    noteId: 'note-1',
                    createdAt: new Date().toISOString(),
                    author: {
                        id: 'test-user-id',
                        name: 'Test User',
                        email: 'test@example.com'
                    }
                }
            }
        }, { status: 201 })
    }),

    // Categories endpoints
    http.get(`${API_BASE_URL}/categories`, () => {
        return HttpResponse.json({
            success: true,
            data: {
                categories: [
                    {
                        id: 'category-1',
                        name: 'JavaScript',
                        slug: 'javascript',
                        description: 'JavaScript tools and libraries',
                        color: '#F7DF1E',
                        createdAt: '2024-01-01T00:00:00Z'
                    },
                    {
                        id: 'category-2',
                        name: 'Python',
                        slug: 'python',
                        description: 'Python tools and frameworks',
                        color: '#3776AB',
                        createdAt: '2024-01-01T00:00:00Z'
                    }
                ]
            }
        })
    }),

    // Tags endpoints
    http.get(`${API_BASE_URL}/tags`, () => {
        return HttpResponse.json({
            success: true,
            data: {
                tags: [
                    {
                        id: 'tag-1',
                        name: 'React',
                        slug: 'react',
                        createdAt: '2024-01-01T00:00:00Z'
                    },
                    {
                        id: 'tag-2',
                        name: 'TypeScript',
                        slug: 'typescript',
                        createdAt: '2024-01-01T00:00:00Z'
                    }
                ]
            }
        })
    })
]