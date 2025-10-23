import { Modal, Button } from 'react-bootstrap';

function InfoModal({ show, onHide, title, body, buttonVariant = 'primary' }) {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant={buttonVariant} onClick={onHide}>
          Okay
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default InfoModal;