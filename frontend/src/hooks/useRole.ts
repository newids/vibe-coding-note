import { useAuth } from "../contexts/AuthContext";

export const useRole = () => {
    const { user, isAuthenticated } = useAuth();

    const isOwner = isAuthenticated && user?.role === 'OWNER';
    const isVisitor = isAuthenticated && (user?.role === 'VISITOR' || user?.role === 'OWNER');
    const isAuthenticated_ = isAuthenticated;

    const hasRole = (role: 'OWNER' | 'VISITOR') => {
        if (!isAuthenticated || !user) return false;

        if (role === 'VISITOR') {
            // Owner has visitor privileges
            return user.role === 'VISITOR' || user.role === 'OWNER';
        }

        return user.role === role;
    };

    const hasAnyRole = (roles: ('OWNER' | 'VISITOR')[]) => {
        return roles.some(role => hasRole(role));
    };

    const canEditNote = (noteAuthorId?: string) => {
        if (!isAuthenticated || !user) return false;

        // Owner can edit any note
        if (user.role === 'OWNER') return true;

        // Author can edit their own note
        return noteAuthorId === user.id;
    };

    const canDeleteNote = (noteAuthorId?: string) => {
        if (!isAuthenticated || !user) return false;

        // Owner can delete any note
        if (user.role === 'OWNER') return true;

        // Author can delete their own note
        return noteAuthorId === user.id;
    };

    const canEditComment = (commentAuthorId?: string) => {
        if (!isAuthenticated || !user) return false;

        // Owner can edit any comment
        if (user.role === 'OWNER') return true;

        // Author can edit their own comment
        return commentAuthorId === user.id;
    };

    const canDeleteComment = (commentAuthorId?: string) => {
        if (!isAuthenticated || !user) return false;

        // Owner can delete any comment
        if (user.role === 'OWNER') return true;

        // Author can delete their own comment
        return commentAuthorId === user.id;
    };

    const canCreateNote = () => {
        return isOwner;
    };

    const canCreateComment = () => {
        return isVisitor;
    };

    const canManageUsers = () => {
        return isOwner;
    };

    const canManageCategories = () => {
        return isOwner;
    };

    const canManageTags = () => {
        return isOwner;
    };

    return {
        user,
        isAuthenticated: isAuthenticated_,
        isOwner,
        isVisitor,
        hasRole,
        hasAnyRole,
        canEditNote,
        canDeleteNote,
        canEditComment,
        canDeleteComment,
        canCreateNote,
        canCreateComment,
        canManageUsers,
        canManageCategories,
        canManageTags,
    };
};