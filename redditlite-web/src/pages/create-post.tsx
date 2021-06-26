import React from 'react';
import { Formik, Form } from 'formik';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { Box, Button, Flex, Link } from '@chakra-ui/react';

const CreatePost: React.FC = ({ }) => {
    return (
        <Wrapper variant="small">
            <Formik initialValues={{ title: '', text: '' }}
                onSubmit={async (values) => {
                    console.log(values)
                }}>
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="title"
                            placeholder="Post Title"
                            label="Title"
                        />
                        <Box mt={4}>
                            <InputField
                                name="text"
                                placeholder="text..."
                                label="Body"
                                type="text"
                            />
                        </Box>
                        <Button
                            mt={4}
                            type="submit"
                            colorScheme="teal"
                            variant="outline"
                            isLoading={isSubmitting}>
                            Create Post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

export default CreatePost;