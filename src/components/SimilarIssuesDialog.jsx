import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertTriangle } from 'lucide-react';

export default function SimilarIssuesDialog({ isOpen, onClose, similarIssues, onProceed }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Similar Issues Found
          </DialogTitle>
          <DialogDescription>
            We found {similarIssues.length} similar issue{similarIssues.length > 1 ? 's' : ''}.
            Please review before creating a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {similarIssues.map((issue) => (
            <div key={issue.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold">{issue.title}</h4>
                <Badge variant={issue.status === 'Done' ? 'default' : 'secondary'}>
                  {issue.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
              <div className="flex gap-2">
                <Badge variant="outline">{issue.priority}</Badge>
                <span className="text-xs text-muted-foreground">
                  Assigned to: {issue.assignedTo}
                </span>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onProceed}>
            Create Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
